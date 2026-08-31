-- Devoluciones y garantias, ligadas a la venta original (se encuentra por
-- folio/codigo de barras en el Historial). Reglas de negocio decididas:
--
-- - "reparacion": solo queda anotada, no toca dinero ni stock.
-- - "cambio" (por el mismo producto, defectuoso -> uno bueno): descuenta 1
--   unidad mas de stock (sale un producto bueno; el defectuoso no vuelve al
--   inventario). No toca dinero.
-- - "dinero" (devolucion de plata al cliente): el mecanico NO devuelve su
--   parte ya repartida; la perdida completa la absorben los dos socios,
--   partida por igual entre ellos. No se toca stock automaticamente (el
--   admin decide aparte si el producto devuelto vuelve a inventario).
--
-- La devolucion se registra en la fecha en que ocurre (no se reescribe la
-- venta original), y se resta del cierre del dia en el que se procesa.

create table public.devoluciones (
  id uuid primary key default gen_random_uuid(),
  venta_id uuid not null references public.ventas (id),
  producto_id uuid references public.productos (id),
  tipo text not null check (tipo in ('reparacion', 'cambio', 'dinero')),
  motivo text,
  monto_devuelto numeric(12, 2) not null default 0 check (monto_devuelto >= 0),
  perdida_socio_1 numeric(12, 2) not null default 0,
  perdida_socio_2 numeric(12, 2) not null default 0,
  registrado_por uuid not null references public.usuarios (id),
  fecha timestamptz not null default now()
);

create index devoluciones_venta_id_idx on public.devoluciones (venta_id);
create index devoluciones_fecha_idx on public.devoluciones (fecha);

alter table public.devoluciones enable row level security;

create policy devoluciones_select_admin on public.devoluciones
  for select using (public.is_admin());

create or replace function public.registrar_devolucion(
  p_venta_id uuid,
  p_producto_id uuid,
  p_tipo text,
  p_motivo text,
  p_monto_devuelto numeric default 0
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_perdida_socio_1 numeric(12, 2) := 0;
  v_perdida_socio_2 numeric(12, 2) := 0;
  v_producto public.productos%rowtype;
begin
  if not public.is_admin() then
    raise exception 'No autorizado';
  end if;

  if p_tipo not in ('reparacion', 'cambio', 'dinero') then
    raise exception 'Tipo de devolución inválido';
  end if;

  if not exists (select 1 from public.ventas where id = p_venta_id) then
    raise exception 'Venta no encontrada';
  end if;

  if p_tipo = 'dinero' then
    if p_monto_devuelto is null or p_monto_devuelto <= 0 then
      raise exception 'El monto devuelto debe ser mayor a 0';
    end if;
    v_perdida_socio_1 := round(p_monto_devuelto * 0.5, 2);
    v_perdida_socio_2 := p_monto_devuelto - v_perdida_socio_1;
  end if;

  if p_tipo = 'cambio' then
    if p_producto_id is null then
      raise exception 'Debe indicar el producto para un cambio';
    end if;

    select * into v_producto from public.productos where id = p_producto_id for update;
    if not found then
      raise exception 'Producto no encontrado';
    end if;
    if v_producto.stock_actual < 1 then
      raise exception 'No hay stock disponible de "%" para el cambio', v_producto.nombre;
    end if;

    update public.productos set stock_actual = stock_actual - 1 where id = p_producto_id;
  end if;

  insert into public.devoluciones (
    venta_id, producto_id, tipo, motivo, monto_devuelto,
    perdida_socio_1, perdida_socio_2, registrado_por
  ) values (
    p_venta_id, p_producto_id, p_tipo, nullif(trim(p_motivo), ''), coalesce(p_monto_devuelto, 0),
    v_perdida_socio_1, v_perdida_socio_2, auth.uid()
  )
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.registrar_devolucion(uuid, uuid, text, text, numeric) to authenticated;
