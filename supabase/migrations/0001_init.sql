-- =========================================================================
-- Lujos El Espejo - esquema inicial
-- Inventario + ventas con reparto de ganancias, roles admin/mecanico.
-- =========================================================================

create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

-- ---------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------

create type public.rol_usuario as enum ('admin', 'mecanico');
create type public.origen_codigo as enum ('fabrica', 'generado');

-- ---------------------------------------------------------------------
-- Tabla: usuarios
-- Perfil de aplicacion asociado 1:1 a auth.users. El login se hace con
-- nombre_usuario (nombre.apellido); el frontend arma un correo ficticio
-- nombre.apellido@<dominio-interno> antes de llamar a Supabase Auth.
-- ---------------------------------------------------------------------

create table public.usuarios (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre_usuario text not null unique,
  nombre_completo text not null,
  rol public.rol_usuario not null default 'mecanico',
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  constraint nombre_usuario_formato check (nombre_usuario ~ '^[a-z0-9]+(\.[a-z0-9]+)+$')
);

comment on table public.usuarios is 'Perfil de aplicacion + rol, 1:1 con auth.users. Se crea desde una Edge Function con service_role.';

-- ---------------------------------------------------------------------
-- Tabla: mecanicos
-- Un mecanico puede o no tener cuenta de acceso (usuario_id nullable).
-- ---------------------------------------------------------------------

create table public.mecanicos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references public.usuarios (id) on delete set null,
  nombre text not null,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create index mecanicos_usuario_id_idx on public.mecanicos (usuario_id);

-- ---------------------------------------------------------------------
-- Tabla: productos
-- ---------------------------------------------------------------------

create table public.productos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  codigo_barras text unique,
  origen_codigo public.origen_codigo,
  costo numeric(12, 2) not null default 0 check (costo >= 0),
  precio_sugerido numeric(12, 2) check (precio_sugerido is null or precio_sugerido >= 0),
  stock_actual integer not null default 0 check (stock_actual >= 0),
  stock_minimo integer not null default 0 check (stock_minimo >= 0),
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  constraint codigo_barras_requiere_origen
    check ((codigo_barras is null and origen_codigo is null) or (codigo_barras is not null and origen_codigo is not null))
);

-- Soporta autocompletado por substring (ILIKE '%termino%') en el buscador de ventas.
create index productos_nombre_trgm_idx on public.productos using gin (nombre gin_trgm_ops);
create index productos_activo_idx on public.productos (activo);

-- Secuencia + helper para codigos internos tipo PROD-0001
create sequence public.productos_codigo_seq start 1;

-- ---------------------------------------------------------------------
-- Tabla: ventas
-- ---------------------------------------------------------------------

create table public.ventas (
  id uuid primary key default gen_random_uuid(),
  fecha_hora timestamptz not null default now(),
  monto_total numeric(12, 2) not null check (monto_total > 0),
  costo_total numeric(12, 2) not null default 0 check (costo_total >= 0),
  mecanico_id uuid not null references public.mecanicos (id),
  registrado_por uuid not null references public.usuarios (id),
  monto_mecanico numeric(12, 2) not null default 0,
  monto_duena numeric(12, 2) not null default 0,
  monto_socio numeric(12, 2) not null default 0,
  metodo_pago text not null check (metodo_pago in ('efectivo', 'tarjeta', 'transferencia')),
  cliente_nombre text,
  created_at timestamptz not null default now()
);

create index ventas_fecha_hora_idx on public.ventas (fecha_hora desc);
create index ventas_mecanico_id_idx on public.ventas (mecanico_id);
create index ventas_registrado_por_idx on public.ventas (registrado_por);

-- ---------------------------------------------------------------------
-- Tabla: venta_productos
-- ---------------------------------------------------------------------

create table public.venta_productos (
  id uuid primary key default gen_random_uuid(),
  venta_id uuid not null references public.ventas (id) on delete cascade,
  producto_id uuid not null references public.productos (id),
  cantidad integer not null check (cantidad > 0),
  costo_unitario numeric(12, 2) not null check (costo_unitario >= 0)
);

create index venta_productos_venta_id_idx on public.venta_productos (venta_id);
create index venta_productos_producto_id_idx on public.venta_productos (producto_id);

-- =========================================================================
-- Funciones auxiliares de rol (security definer para evitar recursion de RLS)
-- =========================================================================

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.usuarios where id = auth.uid() and rol = 'admin' and activo
  );
$$;

grant execute on function public.is_admin() to authenticated;

-- =========================================================================
-- Row Level Security
-- =========================================================================

alter table public.usuarios enable row level security;
alter table public.mecanicos enable row level security;
alter table public.productos enable row level security;
alter table public.ventas enable row level security;
alter table public.venta_productos enable row level security;

-- usuarios: cada quien ve su propio perfil (lo necesita el AuthContext);
-- admin ve y administra todos. La creacion de filas se hace desde la
-- Edge Function create-user con service_role (bypassa RLS).
create policy usuarios_select on public.usuarios
  for select using (id = auth.uid() or public.is_admin());

create policy usuarios_update_admin on public.usuarios
  for update using (public.is_admin()) with check (public.is_admin());

-- mecanicos: cualquier usuario autenticado puede leer la lista (se usa en
-- el selector de ventas y no expone informacion sensible). Solo admin
-- puede crear/editar/desactivar.
create policy mecanicos_select on public.mecanicos
  for select using (auth.role() = 'authenticated');

create policy mecanicos_insert_admin on public.mecanicos
  for insert with check (public.is_admin());

create policy mecanicos_update_admin on public.mecanicos
  for update using (public.is_admin()) with check (public.is_admin());

create policy mecanicos_delete_admin on public.mecanicos
  for delete using (public.is_admin());

-- productos: solo admin puede leer/escribir la tabla base (incluye costo y
-- precio_sugerido). Los mecanicos consultan la vista public.inventario_publico
-- (definida abajo) que solo expone nombre/stock.
create policy productos_select_admin on public.productos
  for select using (public.is_admin());

create policy productos_insert_admin on public.productos
  for insert with check (public.is_admin());

create policy productos_update_admin on public.productos
  for update using (public.is_admin()) with check (public.is_admin());

create policy productos_delete_admin on public.productos
  for delete using (public.is_admin());

-- ventas / venta_productos: solo admin, y unicamente via lectura directa.
-- Las escrituras se hacen exclusivamente a traves de la funcion
-- registrar_venta() (security definer), no hay policies de insert/update
-- para forzar que toda venta pase por esa validacion.
create policy ventas_select_admin on public.ventas
  for select using (public.is_admin());

create policy venta_productos_select_admin on public.venta_productos
  for select using (public.is_admin());

-- =========================================================================
-- Vista de inventario para el rol mecanico (solo lectura, sin costos)
-- Al ser una vista sin RLS propia y creada por el owner de la migracion,
-- se evalua con los privilegios del owner y no queda bloqueada por las
-- policies de "solo admin" de la tabla productos.
-- =========================================================================

create view public.inventario_publico
with (security_invoker = false)
as
select
  id,
  nombre,
  stock_actual,
  stock_minimo,
  activo
from public.productos
where activo = true;

grant select on public.inventario_publico to authenticated;

-- =========================================================================
-- Codigo interno correlativo (PROD-0001, PROD-0002, ...)
-- =========================================================================

create or replace function public.generar_codigo_interno()
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'No autorizado';
  end if;

  return 'PROD-' || lpad(nextval('public.productos_codigo_seq')::text, 4, '0');
end;
$$;

grant execute on function public.generar_codigo_interno() to authenticated;

-- =========================================================================
-- Registro atomico de venta: valida stock, calcula costo/reparto,
-- inserta venta + detalle y descuenta inventario. Es el UNICO camino
-- permitido para crear ventas (ver RLS arriba).
--
-- p_items: jsonb con forma [{ "producto_id": "<uuid>", "cantidad": 2 }, ...]
--
-- Reparto (sobre base_reparto = monto_total - costo_total):
--   monto_mecanico = 50%   monto_duena = 25%   monto_socio = 25%
-- =========================================================================

create or replace function public.registrar_venta(
  p_monto_total numeric,
  p_mecanico_id uuid,
  p_metodo_pago text,
  p_cliente_nombre text,
  p_items jsonb
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
  v_producto public.productos%rowtype;
  v_cantidad integer;
  v_producto_id uuid;
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

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Debe agregar al menos un producto a la venta';
  end if;

  -- Primera pasada: bloquea filas de producto y valida stock disponible.
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

  v_base_reparto := p_monto_total - v_costo_total;

  -- Redondeo por residuo: se calcula monto_mecanico y, del resto exacto
  -- (base_reparto - monto_mecanico), se calcula monto_duena y monto_socio
  -- toma lo que sobra. Así los tres montos SIEMPRE suman exactamente
  -- base_reparto, sin el desfase de +-0.01 que deja redondear cada
  -- porcentaje por separado.
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

  -- Segunda pasada: inserta detalle y descuenta stock.
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

  return v_venta_id;
end;
$$;

grant execute on function public.registrar_venta(numeric, uuid, text, text, jsonb) to authenticated;
