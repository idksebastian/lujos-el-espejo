-- Vista de apoyo para el reporte "productos mas vendidos". Al estar
-- protegida con is_admin() dentro del propio WHERE, aunque el rol de
-- Postgres "authenticated" sea compartido por admin y mecanico, un
-- mecanico autenticado obtiene 0 filas si intenta consultarla.

create view public.reporte_productos_mas_vendidos
with (security_invoker = false)
as
select
  p.id as producto_id,
  p.nombre,
  coalesce(sum(vp.cantidad), 0)::integer as unidades_vendidas
from public.productos p
left join public.venta_productos vp on vp.producto_id = p.id
where public.is_admin()
group by p.id, p.nombre
order by unidades_vendidas desc, p.nombre asc;

grant select on public.reporte_productos_mas_vendidos to authenticated;
