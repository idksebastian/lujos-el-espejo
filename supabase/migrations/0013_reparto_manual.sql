-- El negocio decidio que la division de la plata (mecanico / duena / socio)
-- ya no la calcula el sistema con la formula 50/25/25 -- la escriben ellos
-- mismos al registrar la venta (a veces hay arreglos "chanchullo" que no
-- siguen ese porcentaje). El sistema deja de intervenir en CUANTO le toca a
-- cada quien; solo guarda los valores que ellos pusieron y los sigue usando
-- tal cual para facturas, cierre e historial -- eso no cambia.
--
-- A proposito no se exige que monto_mecanico + monto_duena + monto_socio
-- sume exactamente la ganancia (monto_total - costo_total): piden que sea
-- completamente libre.
--
-- Lo unico que se conserva igual que antes es la sub-division del monto de
-- mecanico entre varios mecanicos (el caso "Santiago"): ahora esa suma se
-- valida contra el monto de mecanico que ELLOS escribieron, no contra uno
-- calculado.

drop function if exists public.registrar_venta(numeric, uuid, text, text, jsonb, jsonb, numeric, jsonb, jsonb);

create or replace function public.registrar_venta(
  p_monto_total numeric,
  p_mecanico_id uuid,
  p_metodo_pago text,
  p_cliente_nombre text,
  p_items jsonb,
  p_monto_mecanico numeric default 0,
  p_monto_duena numeric default 0,
  p_monto_socio numeric default 0,
  p_servicios jsonb default '[]'::jsonb,
  p_monto_factura numeric default null,
  p_externos jsonb default '[]'::jsonb,
  p_mecanicos_extra jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_venta_id uuid;
  v_costo_total numeric(12, 2) := 0;
  v_monto_mecanico_primario numeric(12, 2);
  v_item jsonb;
  v_servicio jsonb;
  v_externo jsonb;
  v_mec_extra jsonb;
  v_mec_extra_id uuid;
  v_mec_extra_monto numeric;
  v_suma_extra numeric(12, 2) := 0;
  v_producto public.productos%rowtype;
  v_cantidad integer;
  v_producto_id uuid;
  v_descripcion text;
  v_monto_servicio numeric;
  v_ext_descripcion text;
  v_ext_costo numeric;
  v_ext_precio numeric;
  v_ext_reparto text;
  v_hay_items boolean;
  v_hay_servicios boolean;
  v_hay_externos boolean;
  v_hay_mecanicos_extra boolean;
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

  if p_mecanico_id is not null and not exists (select 1 from public.mecanicos where id = p_mecanico_id and activo) then
    raise exception 'El mecanico seleccionado no existe o no esta activo';
  end if;

  if p_mecanico_id is null and p_mecanicos_extra is not null and jsonb_typeof(p_mecanicos_extra) = 'array' and jsonb_array_length(p_mecanicos_extra) > 0 then
    raise exception 'No se puede repartir entre mecanicos adicionales si no hay un mecanico principal';
  end if;

  if p_monto_mecanico is null or p_monto_mecanico < 0 then
    raise exception 'El monto del mecanico debe ser un numero valido';
  end if;
  if p_monto_duena is null or p_monto_duena < 0 then
    raise exception 'El monto de la primera socia debe ser un numero valido';
  end if;
  if p_monto_socio is null or p_monto_socio < 0 then
    raise exception 'El monto del segundo socio debe ser un numero valido';
  end if;
  if p_mecanico_id is null and p_monto_mecanico <> 0 then
    raise exception 'No se puede asignar monto de mecanico si no hay un mecanico en la venta';
  end if;

  v_hay_items := p_items is not null and jsonb_typeof(p_items) = 'array' and jsonb_array_length(p_items) > 0;
  v_hay_servicios := p_servicios is not null and jsonb_typeof(p_servicios) = 'array' and jsonb_array_length(p_servicios) > 0;
  v_hay_externos := p_externos is not null and jsonb_typeof(p_externos) = 'array' and jsonb_array_length(p_externos) > 0;
  v_hay_mecanicos_extra := p_mecanicos_extra is not null and jsonb_typeof(p_mecanicos_extra) = 'array' and jsonb_array_length(p_mecanicos_extra) > 0;

  if not v_hay_items and not v_hay_servicios and not v_hay_externos then
    raise exception 'Debe agregar al menos un producto, un servicio especial o un repuesto externo a la venta';
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

  if v_hay_externos then
    for v_externo in select * from jsonb_array_elements(p_externos)
    loop
      v_ext_descripcion := nullif(trim(v_externo ->> 'descripcion'), '');
      v_ext_costo := coalesce((v_externo ->> 'costo')::numeric, 0);
      v_ext_precio := (v_externo ->> 'precio_venta')::numeric;
      v_ext_reparto := coalesce(v_externo ->> 'reparto_gasto', 'ambos');

      if v_ext_descripcion is null then
        raise exception 'Cada repuesto externo necesita una descripcion';
      end if;
      if v_ext_precio is null or v_ext_precio < 0 then
        raise exception 'Precio de venta invalido para "%"', v_ext_descripcion;
      end if;
      if v_ext_costo < 0 then
        raise exception 'Costo invalido para "%"', v_ext_descripcion;
      end if;
      if v_ext_reparto not in ('ambos', 'socio1', 'socio2') then
        raise exception 'Reparto de gasto invalido para "%"', v_ext_descripcion;
      end if;
    end loop;
  end if;

  if v_hay_mecanicos_extra then
    for v_mec_extra in select * from jsonb_array_elements(p_mecanicos_extra)
    loop
      v_mec_extra_id := (v_mec_extra ->> 'mecanico_id')::uuid;
      v_mec_extra_monto := (v_mec_extra ->> 'monto')::numeric;

      if v_mec_extra_id is null then
        raise exception 'Falta el mecanico en uno de los repartos adicionales';
      end if;
      if v_mec_extra_id = p_mecanico_id then
        raise exception 'Un mecanico no puede aparecer dos veces en la misma venta';
      end if;
      if not exists (select 1 from public.mecanicos where id = v_mec_extra_id and activo) then
        raise exception 'Uno de los mecanicos adicionales no existe o no esta activo';
      end if;
      if v_mec_extra_monto is null or v_mec_extra_monto < 0 then
        raise exception 'Monto invalido para un mecanico adicional';
      end if;

      v_suma_extra := v_suma_extra + v_mec_extra_monto;
    end loop;
  end if;

  if v_suma_extra > p_monto_mecanico then
    raise exception 'La suma de los mecanicos adicionales ($%) supera el monto de mecanico asignado ($%)',
      v_suma_extra, p_monto_mecanico;
  end if;

  v_monto_mecanico_primario := p_monto_mecanico - v_suma_extra;

  insert into public.ventas (
    monto_total, costo_total, mecanico_id, registrado_por,
    monto_mecanico, monto_duena, monto_socio, metodo_pago, cliente_nombre, monto_factura
  ) values (
    p_monto_total, v_costo_total, p_mecanico_id, auth.uid(),
    v_monto_mecanico_primario, p_monto_duena, p_monto_socio,
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

  if v_hay_externos then
    for v_externo in select * from jsonb_array_elements(p_externos)
    loop
      v_ext_descripcion := trim(v_externo ->> 'descripcion');
      v_ext_costo := coalesce((v_externo ->> 'costo')::numeric, 0);
      v_ext_precio := (v_externo ->> 'precio_venta')::numeric;
      v_ext_reparto := coalesce(v_externo ->> 'reparto_gasto', 'ambos');

      insert into public.venta_servicios (venta_id, descripcion, monto, es_externo, costo_externo)
      values (v_venta_id, v_ext_descripcion, v_ext_precio, true, v_ext_costo);

      if v_ext_costo > 0 then
        insert into public.gastos (descripcion, monto, registrado_por, reparto, venta_id)
        values ('Costo externo: ' || v_ext_descripcion, v_ext_costo, auth.uid(), v_ext_reparto, v_venta_id);
      end if;
    end loop;
  end if;

  if v_hay_mecanicos_extra then
    for v_mec_extra in select * from jsonb_array_elements(p_mecanicos_extra)
    loop
      insert into public.venta_mecanicos_extra (venta_id, mecanico_id, monto)
      values (v_venta_id, (v_mec_extra ->> 'mecanico_id')::uuid, (v_mec_extra ->> 'monto')::numeric);
    end loop;
  end if;

  return v_venta_id;
end;
$$;

grant execute on function public.registrar_venta(numeric, uuid, text, text, jsonb, numeric, numeric, numeric, jsonb, numeric, jsonb, jsonb) to authenticated;
