-- Configuracion general del negocio: nombres reales para "dueña"/"socio"
-- (en vez de esas etiquetas genericas en toda la app) y los NIT personales
-- que a veces los clientes piden en la factura (el negocio no tiene NIT
-- propio por no estar formalizado, asi que se ofrece el de uno de los
-- socios cuando lo piden).
--
-- Tabla de una sola fila ("singleton"): el truco id boolean primary key
-- default true + check(id) garantiza que nunca pueda existir mas de una
-- fila (id solo puede ser el valor true).

create table public.configuracion (
  id boolean primary key default true,
  nombre_duena text not null default 'Dueña',
  nombre_socio text not null default 'Socio',
  nit_duena text,
  nit_socio text,
  constraint configuracion_singleton check (id)
);

insert into public.configuracion (id) values (true);

alter table public.configuracion enable row level security;

create policy configuracion_select_admin on public.configuracion
  for select using (public.is_admin());

create policy configuracion_update_admin on public.configuracion
  for update using (public.is_admin()) with check (public.is_admin());
