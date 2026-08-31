-- Tres cosas nuevas, sin relacion entre si mas que llegar juntas:
--
-- 1) Gastos del dia (gasolina, insumos, etc.). Se restan del cierre
--    repartidos 50/50 entre los dos socios, igual que una devolucion en
--    dinero: el mecanico nunca pierde nada.
--
-- 2) Ajuste manual de stock (sumar o restar, con motivo) — hoy no existia
--    ninguna forma de aumentarle el stock a un producto ya creado.
--
-- 3) "Monto de factura" distinto al monto registrado: cubre el caso donde
--    lo que se registra para hacer la division (ej. $150.000) es menor a
--    lo que realmente se le cobro al cliente (ej. $200.000, porque una
--    parte se acordo aparte con uno de los socios). La factura debe
--    reflejar siempre lo que el cliente pago de verdad.

-- ---------------------------------------------------------------------
-- Gastos
-- ---------------------------------------------------------------------

create table public.gastos (
  id uuid primary key default gen_random_uuid(),
  descripcion text not null,
  monto numeric(12, 2) not null check (monto > 0),
  registrado_por uuid not null references public.usuarios (id),
  fecha timestamptz not null default now()
);

create index gastos_fecha_idx on public.gastos (fecha);

alter table public.gastos enable row level security;

create policy gastos_select_admin on public.gastos
  for select using (public.is_admin());

create policy gastos_insert_admin on public.gastos
  for insert with check (public.is_admin());

create policy gastos_delete_admin on public.gastos
  for delete using (public.is_admin());

-- ---------------------------------------------------------------------
-- Ajustes de stock
-- ---------------------------------------------------------------------

create table public.stock_ajustes (
  id uuid primary key default gen_random_uuid(),
  producto_id uuid not null references public.productos (id),
  delta integer not null check (delta <> 0),
  motivo text,
  registrado_por uuid not null references public.usuarios (id),
  fecha timestamptz not null default now()
);

create index stock_ajustes_producto_id_idx on public.stock_ajustes (producto_id);

alter table public.stock_ajustes enable row level security;

create policy stock_ajustes_select_admin on public.stock_ajustes
  for select using (public.is_admin());

create or replace function public.ajustar_stock(
  p_producto_id uuid,
  p_delta integer,
  p_motivo text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_producto public.productos%rowtype;
begin
  if not public.is_admin() then
    raise exception 'No autorizado';
  end if;

  if p_delta is null or p_delta = 0 then
    raise exception 'La cantidad a ajustar no puede ser 0';
  end if;

  select * into v_producto from public.productos where id = p_producto_id for update;
  if not found then
    raise exception 'Producto no encontrado';
  end if;

  if v_producto.stock_actual + p_delta < 0 then
    raise exception 'Ese ajuste dejaría el stock de "%" en negativo (actual: %)', v_producto.nombre, v_producto.stock_actual;
  end if;

  update public.productos set stock_actual = stock_actual + p_delta where id = p_producto_id;

  insert into public.stock_ajustes (producto_id, delta, motivo, registrado_por)
  values (p_producto_id, p_delta, nullif(trim(p_motivo), ''), auth.uid());
end;
$$;

grant execute on function public.ajustar_stock(uuid, integer, text) to authenticated;

-- ---------------------------------------------------------------------
-- Monto de factura distinto al monto registrado
-- ---------------------------------------------------------------------

alter table public.ventas add column monto_factura numeric(12, 2) check (monto_factura is null or monto_factura > 0);

drop function if exists public.registrar_venta(numeric, uuid, text, text, jsonb, jsonb);

create or replace function public.registrar_venta(
  p_monto_total numeric,
  p_mecanico_id uuid,
  p_metodo_pago text,
  p_cliente_nombre text,
  p_items jsonb,
  p_servicios jsonb default '[]'::jsonb,
  p_monto_factura numeric default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_venta_id uuid;
  v_costo_total numeric(12, 2) := 0;
  v_base_reparto numeric(12, 2);
  v_monto_mecanico numeric(12, 2);
  v_resto numeric(12, 2);
  v_monto_duena numeric(12, 2);
  v_monto_socio numeric(12, 2);
  v_item jsonb;
  v_servicio jsonb;
  v_producto public.productos%rowtype;
  v_cantidad integer;
  v_producto_id uuid;
  v_descripcion text;
  v_monto_servicio numeric;
  v_hay_items boolean;
  v_hay_servicios boolean;
begin
  if not public.is_admin() then
    raise exception 'No autorizado';
  end if;

  if p_monto_total is null or p_monto_total <= 0 then
    raise exception 'El monto total pagado debe ser mayor a 0';
  end if;

  if p_monto_factura is not null and p_monto_factura <= 0 then
    raise exception 'El monto de la factura debe ser mayor a 0';
  end if;

  if p_mecanico_id is null then
    raise exception 'Debe seleccionar un mecanico';
  end if;

  if not exists (select 1 from public.mecanicos where id = p_mecanico_id and activo) then
    raise exception 'El mecanico seleccionado no existe o no esta activo';
  end if;

  v_hay_items := p_items is not null and jsonb_typeof(p_items) = 'array' and jsonb_array_length(p_items) > 0;
  v_hay_servicios := p_servicios is not null and jsonb_typeof(p_servicios) = 'array' and jsonb_array_length(p_servicios) > 0;

  if not v_hay_items and not v_hay_servicios then
    raise exception 'Debe agregar al menos un producto o un servicio especial a la venta';
  end if;

  -- Primera pasada: bloquea filas de producto y valida stock disponible.
  if v_hay_items then
    for v_item in select * from jsonb_array_elements(p_items)
    loop
      v_producto_id := (v_item ->> 'producto_id')::uuid;
      v_cantidad := (v_item ->> 'cantidad')::integer;

      if v_cantidad is null or v_cantidad <= 0 then
        raise exception 'Cantidad invalida para el producto %', v_producto_id;
      end if;

      select * into v_producto from public.productos where id = v_producto_id for update;

      if not found then
        raise exception 'Producto no encontrado: %', v_producto_id;
      end if;

      if v_producto.stock_actual < v_cantidad then
        raise exception 'Stock insuficiente para "%": disponible %, solicitado %',
          v_producto.nombre, v_producto.stock_actual, v_cantidad;
      end if;

      v_costo_total := v_costo_total + (v_producto.costo * v_cantidad);
    end loop;
  end if;

  if v_hay_servicios then
    for v_servicio in select * from jsonb_array_elements(p_servicios)
    loop
      v_descripcion := nullif(trim(v_servicio ->> 'descripcion'), '');
      v_monto_servicio := (v_servicio ->> 'monto')::numeric;

      if v_descripcion is null then
        raise exception 'Cada servicio especial necesita una descripcion';
      end if;
      if v_monto_servicio is null or v_monto_servicio < 0 then
        raise exception 'Monto invalido para el servicio "%"', v_descripcion;
      end if;
    end loop;
  end if;

  v_base_reparto := p_monto_total - v_costo_total;

  -- Redondeo por residuo: ver comentario en 0001_init.sql. Garantiza que
  -- los tres montos siempre sumen exactamente base_reparto.
  v_monto_mecanico := round(v_base_reparto * 0.50, 2);
  v_resto := v_base_reparto - v_monto_mecanico;
  v_monto_duena := round(v_resto * 0.50, 2);
  v_monto_socio := v_resto - v_monto_duena;

  insert into public.ventas (
    monto_total, costo_total, mecanico_id, registrado_por,
    monto_mecanico, monto_duena, monto_socio, metodo_pago, cliente_nombre, monto_factura
  ) values (
    p_monto_total, v_costo_total, p_mecanico_id, auth.uid(),
    v_monto_mecanico, v_monto_duena, v_monto_socio,
    p_metodo_pago, nullif(trim(p_cliente_nombre), ''), p_monto_factura
  )
  returning id into v_venta_id;

  -- Segunda pasada: inserta detalle de productos y descuenta stock.
  if v_hay_items then
    for v_item in select * from jsonb_array_elements(p_items)
    loop
      v_producto_id := (v_item ->> 'producto_id')::uuid;
      v_cantidad := (v_item ->> 'cantidad')::integer;

      select * into v_producto from public.productos where id = v_producto_id;

      insert into public.venta_productos (venta_id, producto_id, cantidad, costo_unitario)
      values (v_venta_id, v_producto.id, v_cantidad, v_producto.costo);

      update public.productos
        set stock_actual = stock_actual - v_cantidad
        where id = v_producto.id;
    end loop;
  end if;

  if v_hay_servicios then
    for v_servicio in select * from jsonb_array_elements(p_servicios)
    loop
      v_descripcion := trim(v_servicio ->> 'descripcion');
      v_monto_servicio := (v_servicio ->> 'monto')::numeric;

      insert into public.venta_servicios (venta_id, descripcion, monto)
      values (v_venta_id, v_descripcion, v_monto_servicio);
    end loop;
  end if;

  return v_venta_id;
end;
$$;

grant execute on function public.registrar_venta(numeric, uuid, text, text, jsonb, jsonb, numeric) to authenticated;
