-- Permite eliminar una venta ya registrada (por ejemplo, una de prueba que
-- quedo mezclada con las reales). No es un simple DELETE: hay que devolver
-- el stock que se desconto, borrar los gastos que se hayan generado por
-- repuestos externos de esa venta, y NO se permite si la venta ya tiene
-- una devolucion/garantia registrada (ahi la operacion es mas delicada y
-- se maneja aparte, a mano).

create or replace function public.eliminar_venta(p_venta_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item record;
begin
  if not public.is_admin() then
    raise exception 'No autorizado';
  end if;

  if not exists (select 1 from public.ventas where id = p_venta_id) then
    raise exception 'Venta no encontrada';
  end if;

  if exists (select 1 from public.devoluciones where venta_id = p_venta_id) then
    raise exception 'Esta venta ya tiene una devolución/garantía registrada — no se puede eliminar así.';
  end if;

  -- Devolver el stock de los productos vendidos.
  for v_item in select producto_id, cantidad from public.venta_productos where venta_id = p_venta_id
  loop
    update public.productos set stock_actual = stock_actual + v_item.cantidad where id = v_item.producto_id;
  end loop;

  -- Gastos generados automáticamente por repuestos externos de esta venta.
  delete from public.gastos where venta_id = p_venta_id;

  -- venta_productos, venta_servicios y venta_mecanicos_extra tienen
  -- "on delete cascade" hacia ventas, se borran solos.
  delete from public.ventas where id = p_venta_id;
end;
$$;

grant execute on function public.eliminar_venta(uuid) to authenticated;
