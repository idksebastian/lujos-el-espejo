-- Servicios especiales: mano de obra suelta sin producto asociado (ej. "el
-- cliente llevaba el espejo + instalacion, pero tambien pidio arreglar la
-- bisagra de la puerta aparte"). No tienen costo de materiales ni afectan
-- stock; existen para dejar un desglose de todo lo que se cobro en la
-- venta. El reparto NO cambia: se sigue calculando sobre
-- monto_total - costo_total (monto_total ya incluye el valor del servicio,
-- negociado como parte del total de la venta), repartido 50/25/25 igual
-- que siempre.

create table public.venta_servicios (
  id uuid primary key default gen_random_uuid(),
  venta_id uuid not null references public.ventas (id) on delete cascade,
  descripcion text not null,
  monto numeric(12, 2) not null check (monto >= 0)
);

create index venta_servicios_venta_id_idx on public.venta_servicios (venta_id);

alter table public.venta_servicios enable row level security;

create policy venta_servicios_select_admin on public.venta_servicios
  for select using (public.is_admin());

-- registrar_venta se reemplaza por completo (no solo se le agrega un
-- parametro) para poder relajar la validacion "al menos un producto":
-- ahora una venta puede ser solo productos, solo servicios especiales, o
-- ambos.
drop function if exists public.registrar_venta(numeric, uuid, text, text, jsonb);

create or replace function public.registrar_venta(
  p_monto_total numeric,
  p_mecanico_id uuid,
  p_metodo_pago text,
  p_cliente_nombre text,
  p_items jsonb,
  p_servicios jsonb default '[]'::jsonb
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
    monto_mecanico, monto_duena, monto_socio, metodo_pago, cliente_nombre
  ) values (
    p_monto_total, v_costo_total, p_mecanico_id, auth.uid(),
    v_monto_mecanico, v_monto_duena, v_monto_socio,
    p_metodo_pago, nullif(trim(p_cliente_nombre), '')
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

grant execute on function public.registrar_venta(numeric, uuid, text, text, jsonb, jsonb) to authenticated;
