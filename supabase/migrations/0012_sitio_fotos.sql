-- Fotos del sitio público (landing), administrables desde /admin/sitio-web.
-- Completamente separado de inventario/ventas/productos: esto solo guarda
-- imágenes de marketing (galerías de "trabajos realizados", etc.) para la
-- web pública, identificadas por un slot_key fijo (ej. 'lunas-galeria-1').
--
-- El bucket es publico porque estas fotos se muestran sin autenticación en
-- lujoselespejo.com — no hay nada sensible en él (ni costos, ni inventario,
-- ni datos de clientes).

insert into storage.buckets (id, name, public)
values ('sitio-fotos', 'sitio-fotos', true)
on conflict (id) do nothing;

create policy "sitio_fotos lectura publica"
on storage.objects for select
using (bucket_id = 'sitio-fotos');

create policy "sitio_fotos escritura admin"
on storage.objects for all
using (bucket_id = 'sitio-fotos' and public.is_admin())
with check (bucket_id = 'sitio-fotos' and public.is_admin());

create table public.sitio_fotos (
  slot_key text primary key,
  url text not null,
  storage_path text not null,
  actualizado_por uuid references public.usuarios (id),
  updated_at timestamptz not null default now()
);

alter table public.sitio_fotos enable row level security;

create policy "sitio_fotos select publico"
on public.sitio_fotos for select
using (true);

create policy "sitio_fotos insert admin"
on public.sitio_fotos for insert
with check (public.is_admin());

create policy "sitio_fotos update admin"
on public.sitio_fotos for update
using (public.is_admin()) with check (public.is_admin());

create policy "sitio_fotos delete admin"
on public.sitio_fotos for delete
using (public.is_admin());

grant select on public.sitio_fotos to anon, authenticated;
grant insert, update, delete on public.sitio_fotos to authenticated;
