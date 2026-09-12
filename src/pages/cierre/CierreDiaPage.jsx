import { useMemo, useState } from 'react'
import { Download, TriangleAlert, DollarSign, Receipt, Wrench, Undo2, Camera, ChevronDown, PackageSearch, Wallet, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { rangoDiaLocal } from '../../lib/fechas'
import { generarCierrePng } from '../../lib/recibo'
import ImagenGeneradaPreview from '../../components/ImagenGeneradaPreview'
import BarcodeScannerModal from '../../components/BarcodeScannerModal'
import { useConfiguracion } from '../../contexts/ConfiguracionContext'

function hoyISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function CierreDiaPage() {
  const { nombre_socio_1: nombreSocio1, nombre_socio_2: nombreSocio2 } = useConfiguracion()
  const [fecha, setFecha] = useState(hoyISO())
  const [ventas, setVentas] = useState(null)
  const [devoluciones, setDevoluciones] = useState(null)
  const [gastos, setGastos] = useState(null)
  const [productosActivos, setProductosActivos] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [generando, setGenerando] = useState(false)
  const [cierreBlob, setCierreBlob] = useState(null)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [mostrarSinVentas, setMostrarSinVentas] = useState(false)
  const [eliminandoId, setEliminandoId] = useState(null)

  async function handleEliminarVenta(venta) {
    if (
      !window.confirm(
        `¿Eliminar esta venta (${venta.hora} · $${venta.montoTotal.toLocaleString('es-CO')})? Se devuelve el stock de los productos y no se puede deshacer.`
      )
    ) {
      return
    }

    setEliminandoId(venta.id)
    setError('')
    const { error: err } = await supabase.rpc('eliminar_venta', { p_venta_id: venta.id })
    setEliminandoId(null)

    if (err) {
      setError(err.message)
      return
    }
    handleGenerar(fecha)
  }

  async function handleGenerar(fechaParam) {
    const f = fechaParam ?? fecha
    setCargando(true)
    setError('')
    setVentas(null)
    setDevoluciones(null)
    setGastos(null)
    setCierreBlob(null)

    const { desde, hasta } = rangoDiaLocal(f)
    const [ventasRes, devolucionesRes, gastosRes, productosRes] = await Promise.all([
      supabase
        .from('ventas')
        .select(
          `id, fecha_hora, monto_total, monto_mecanico, monto_duena, monto_socio, metodo_pago,
           mecanico:mecanicos(nombre),
           registrador:usuarios(nombre_completo),
           venta_productos(cantidad, producto:productos(id, nombre)),
           venta_servicios(descripcion, monto, es_externo, costo_externo),
           venta_mecanicos_extra(monto, mecanico:mecanicos(nombre))`
        )
        .gte('fecha_hora', desde)
        .lte('fecha_hora', hasta)
        .order('fecha_hora', { ascending: true }),
      supabase
        .from('devoluciones')
        .select('id, venta_id, tipo, motivo, monto_devuelto, perdida_socio_1, perdida_socio_2, fecha, producto:productos(nombre)')
        .gte('fecha', desde)
        .lte('fecha', hasta)
        .order('fecha', { ascending: true }),
      supabase
        .from('gastos')
        .select('id, descripcion, monto, fecha, reparto, registrador:usuarios(nombre_completo)')
        .gte('fecha', desde)
        .lte('fecha', hasta)
        .order('fecha', { ascending: true }),
      supabase.from('productos').select('id, nombre').eq('activo', true).order('nombre'),
    ])

    if (ventasRes.error) setError(ventasRes.error.message)
    else if (devolucionesRes.error) setError(devolucionesRes.error.message)
    else if (gastosRes.error) setError(gastosRes.error.message)
    else if (productosRes.error) setError(productosRes.error.message)
    else {
      setVentas(ventasRes.data ?? [])
      setDevoluciones(devolucionesRes.data ?? [])
      setGastos(gastosRes.data ?? [])
      setProductosActivos(productosRes.data ?? [])
    }
    setCargando(false)
  }

  function handleEscaneado(codigo) {
    setScannerOpen(false)
    const match = codigo.trim().match(/^CIERRE-(\d{4}-\d{2}-\d{2})$/)
    if (!match) {
      setError('Ese código no corresponde a un cierre del día (escanea el código de barras impreso en la imagen de cierre).')
      return
    }
    setFecha(match[1])
    handleGenerar(match[1])
  }

  const resumen = useMemo(() => {
    if (!ventas || !devoluciones || !gastos || !productosActivos) return null

    const totalDevuelto = devoluciones.reduce((s, d) => s + Number(d.monto_devuelto), 0)
    const totalGastos = gastos.reduce((s, g) => s + Number(g.monto), 0)

    let gastoSocio1 = 0
    let gastoSocio2 = 0
    for (const g of gastos) {
      const monto = Number(g.monto)
      if (g.reparto === 'socio1') gastoSocio1 += monto
      else if (g.reparto === 'socio2') gastoSocio2 += monto
      else {
        const mitad = Math.round((monto / 2) * 100) / 100
        gastoSocio1 += mitad
        gastoSocio2 += monto - mitad
      }
    }
    const perdidaSocio1 = devoluciones.reduce((s, d) => s + Number(d.perdida_socio_1), 0) + gastoSocio1
    const perdidaSocio2 = devoluciones.reduce((s, d) => s + Number(d.perdida_socio_2), 0) + gastoSocio2

    // El cierre usa siempre el monto REGISTRADO (monto_total), nunca el real
    // de factura — es el documento que se comparte con el otro socio, y
    // debe verse como si el monto registrado fuera la venta completa (el
    // ajuste de un "chanchullo" solo debe quedar visible en el Historial,
    // que es de uso interno).
    const totalVendido = ventas.reduce((s, v) => s + Number(v.monto_total), 0)
    const totalNeto = totalVendido - totalDevuelto
    const totalServicios = ventas.reduce(
      (s, v) => s + (v.venta_servicios ?? []).reduce((s2, srv) => s2 + Number(srv.monto), 0),
      0
    )
    const numServicios = ventas.reduce((s, v) => s + (v.venta_servicios?.length ?? 0), 0)
    const repartoTotal = ventas.reduce(
      (acc, v) => {
        const extra = (v.venta_mecanicos_extra ?? []).reduce((s, e) => s + Number(e.monto), 0)
        return {
          mecanico: acc.mecanico + Number(v.monto_mecanico) + extra,
          duena: acc.duena + Number(v.monto_duena),
          socio: acc.socio + Number(v.monto_socio),
        }
      },
      { mecanico: 0, duena: 0, socio: 0 }
    )
    repartoTotal.duena -= perdidaSocio1
    repartoTotal.socio -= perdidaSocio2

    // Cada mecánico por su nombre — si una venta tuvo 2 mecánicos (uno con
    // un monto aparte, el otro con el resto), cada uno aparece con lo que
    // realmente le correspondió. "Ventas generadas" solo se le atribuye al
    // mecánico principal de la venta, para no contar el mismo total dos
    // veces si hubo un segundo mecánico.
    const porMecanicoMap = new Map()
    for (const v of ventas) {
      const nombre = v.mecanico?.nombre ?? 'Sin asignar'
      const actual = porMecanicoMap.get(nombre) ?? { nombre, totalGenerado: 0, totalCorresponde: 0 }
      actual.totalGenerado += Number(v.monto_total)
      actual.totalCorresponde += Number(v.monto_mecanico)
      porMecanicoMap.set(nombre, actual)

      for (const extra of v.venta_mecanicos_extra ?? []) {
        const nombreExtra = extra.mecanico?.nombre ?? 'Sin asignar'
        const actualExtra = porMecanicoMap.get(nombreExtra) ?? { nombre: nombreExtra, totalGenerado: 0, totalCorresponde: 0 }
        actualExtra.totalCorresponde += Number(extra.monto)
        porMecanicoMap.set(nombreExtra, actualExtra)
      }
    }

    // Qué se vendió, agrupado por producto — y por diferencia, qué no se
    // vendió (productos activos sin ni una unidad movida este día).
    const productosVendidosMap = new Map()
    const idsVendidosHoy = new Set()
    for (const v of ventas) {
      for (const p of v.venta_productos ?? []) {
        const nombre = p.producto?.nombre ?? '—'
        productosVendidosMap.set(nombre, (productosVendidosMap.get(nombre) ?? 0) + p.cantidad)
        if (p.producto?.id) idsVendidosHoy.add(p.producto.id)
      }
    }
    const productosVendidos = [...productosVendidosMap.entries()]
      .map(([nombre, cantidad]) => ({ nombre, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
    const totalUnidadesVendidas = productosVendidos.reduce((s, p) => s + p.cantidad, 0)
    const productosSinVentas = productosActivos.filter((p) => !idsVendidosHoy.has(p.id))

    return {
      totalVendido,
      totalNeto,
      totalServicios,
      numServicios,
      numVentas: ventas.length,
      repartoTotal,
      porMecanico: [...porMecanicoMap.values()],
      productosVendidos,
      totalUnidadesVendidas,
      productosSinVentas,
      ventasDetalle: ventas.map((v) => ({
        hora: new Date(v.fecha_hora).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
        mecanicoNombre: v.mecanico?.nombre ?? 'Sin asignar',
        montoTotal: Number(v.monto_total),
      })),
      ventasCompletas: ventas.map((v) => ({
        id: v.id,
        hora: new Date(v.fecha_hora).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
        mecanico: v.mecanico?.nombre ?? 'Sin asignar',
        registrador: v.registrador?.nombre_completo ?? '—',
        metodoPago: v.metodo_pago,
        montoTotal: Number(v.monto_total),
        productos: (v.venta_productos ?? []).map((p) => `${p.producto?.nombre ?? '—'} ×${p.cantidad}`),
        servicios: (v.venta_servicios ?? []).map(
          (s) => `${s.descripcion}${s.es_externo ? ' (externo)' : ''} ($${money(s.monto)})`
        ),
      })),
      totalDevuelto,
      numDevoluciones: devoluciones.length,
      devolucionesDetalle: devoluciones.map((d) => ({
        folio: d.venta_id.slice(0, 8).toUpperCase(),
        tipo: d.tipo,
        producto: d.producto?.nombre ?? null,
        motivo: d.motivo ?? null,
        montoDevuelto: Number(d.monto_devuelto),
      })),
      totalGastos,
      numGastos: gastos.length,
      gastosDetalle: gastos.map((g) => ({
        descripcion: g.descripcion,
        monto: Number(g.monto),
        reparto: g.reparto,
        hora: new Date(g.fecha).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      })),
    }
  }, [ventas, devoluciones, gastos, productosActivos])

  async function handleGenerarImagen() {
    setGenerando(true)
    try {
      const blob = await generarCierrePng({
        folio: `CIERRE-${fecha}`,
        fecha: new Date(`${fecha}T12:00:00`).toLocaleDateString('es-CO', { dateStyle: 'long' }),
        totalVendido: resumen.totalVendido,
        totalNeto: resumen.totalNeto,
        numVentas: resumen.numVentas,
        totalServicios: resumen.totalServicios,
        numServicios: resumen.numServicios,
        repartoTotal: resumen.repartoTotal,
        porMecanico: resumen.porMecanico,
        ventas: resumen.ventasDetalle,
        devoluciones: resumen.devolucionesDetalle,
        gastos: resumen.gastosDetalle,
        nombreSocio1,
        nombreSocio2,
      })
      setCierreBlob(blob)
    } catch (err) {
      setError('No se pudo generar la imagen: ' + err.message)
    } finally {
      setGenerando(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <h1 className="font-display text-2xl text-white">Cierre del día</h1>

      <div className="card flex flex-wrap items-end gap-2 p-4">
        <label className="block">
          <span className="mb-1 block text-xs uppercase tracking-wide text-muted">Fecha</span>
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="input" />
        </label>
        <button onClick={() => handleGenerar()} disabled={cargando} className="btn-primary">
          {cargando ? 'Consultando…' : 'Generar cierre'}
        </button>
        <button type="button" onClick={() => setScannerOpen(true)} className="btn-secondary">
          <Camera size={16} />
          Escanear cierre
        </button>
      </div>

      {error && (
        <p className="flex items-center gap-2 rounded-lg bg-brand-700/15 px-3 py-2 text-sm text-brand-400 ring-1 ring-brand-700/30">
          <TriangleAlert size={16} className="shrink-0" />
          {error}
        </p>
      )}

      {resumen && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="card flex items-center gap-3 p-4">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-600/15 text-brand-500">
                <DollarSign size={18} />
              </span>
              <span>
                <p className="text-xs text-muted">Total vendido</p>
                <p className="text-lg font-semibold text-white">${resumen.totalVendido.toLocaleString('es-CO')}</p>
                {resumen.totalDevuelto > 0 && (
                  <p className="text-xs text-muted">Neto: ${resumen.totalNeto.toLocaleString('es-CO')}</p>
                )}
              </span>
            </div>
            <div className="card flex items-center gap-3 p-4">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-600/15 text-brand-500">
                <Receipt size={18} />
              </span>
              <span>
                <p className="text-xs text-muted">Ventas</p>
                <p className="text-lg font-semibold text-white">{resumen.numVentas}</p>
              </span>
            </div>
            <div className="card flex items-center gap-3 p-4">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-600/15 text-brand-500">
                <Wrench size={18} />
              </span>
              <span>
                <p className="text-xs text-muted">Servicios especiales</p>
                <p className="text-lg font-semibold text-white">
                  ${resumen.totalServicios.toLocaleString('es-CO')} ({resumen.numServicios})
                </p>
              </span>
            </div>
            {resumen.numDevoluciones > 0 && (
              <div className="card flex items-center gap-3 p-4">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-600/15 text-brand-500">
                  <Undo2 size={18} />
                </span>
                <span>
                  <p className="text-xs text-muted">Devoluciones/garantías</p>
                  <p className="text-lg font-semibold text-white">
                    ${resumen.totalDevuelto.toLocaleString('es-CO')} ({resumen.numDevoluciones})
                  </p>
                </span>
              </div>
            )}
            {resumen.numGastos > 0 && (
              <div className="card flex items-center gap-3 p-4">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-600/15 text-brand-500">
                  <Wallet size={18} />
                </span>
                <span>
                  <p className="text-xs text-muted">Gastos</p>
                  <p className="text-lg font-semibold text-white">
                    ${resumen.totalGastos.toLocaleString('es-CO')} ({resumen.numGastos})
                  </p>
                </span>
              </div>
            )}
          </div>

          {resumen.numGastos > 0 && (
            <div className="card p-4">
              <p className="mb-3 text-sm font-semibold text-white/80">Gastos del día</p>
              <ul className="space-y-1.5 text-sm">
                {resumen.gastosDetalle.map((g, i) => (
                  <li key={i} className="flex items-center justify-between text-muted">
                    <span>
                      {g.hora} — {g.descripcion}
                      {g.reparto === 'socio1' && ` (solo ${nombreSocio1})`}
                      {g.reparto === 'socio2' && ` (solo ${nombreSocio2})`}
                    </span>
                    <span className="text-white/80">${g.monto.toLocaleString('es-CO')}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {resumen.numDevoluciones > 0 && (
            <div className="card p-4">
              <p className="mb-3 text-sm font-semibold text-white/80">Devoluciones y garantías del día</p>
              <ul className="space-y-1.5 text-sm">
                {resumen.devolucionesDetalle.map((d, i) => (
                  <li key={i} className="text-muted">
                    <span className="font-mono text-xs text-white/60">{d.folio}</span> —{' '}
                    {d.tipo === 'dinero' && `Devolución de $${d.montoDevuelto.toLocaleString('es-CO')}`}
                    {d.tipo === 'cambio' && `Cambio${d.producto ? ` (${d.producto})` : ''}`}
                    {d.tipo === 'reparacion' && 'Reparación gratuita'}
                    {d.motivo && ` — ${d.motivo}`}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="card p-4">
            <p className="mb-3 text-sm font-semibold text-white/80">
              Qué se vendió — {resumen.totalUnidadesVendidas} unidad{resumen.totalUnidadesVendidas !== 1 && 'es'} ·{' '}
              {resumen.productosVendidos.length} producto{resumen.productosVendidos.length !== 1 && 's'} distinto
              {resumen.productosVendidos.length !== 1 && 's'}
            </p>
            {resumen.productosVendidos.length === 0 ? (
              <p className="text-sm text-muted">No se vendió ningún producto este día.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {resumen.productosVendidos.map((p) => (
                  <span key={p.nombre} className="rounded-lg bg-white/5 px-2.5 py-1.5 text-sm text-white">
                    {p.nombre} <span className="text-muted">×{p.cantidad}</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {resumen.productosSinVentas.length > 0 && (
            <div className="card p-4">
              <button
                onClick={() => setMostrarSinVentas((v) => !v)}
                className="flex w-full items-center justify-between text-left"
              >
                <span className="flex items-center gap-2 text-sm font-semibold text-white/80">
                  <PackageSearch size={16} />
                  Productos sin ventas hoy ({resumen.productosSinVentas.length})
                </span>
                <ChevronDown size={16} className={`text-muted transition-transform ${mostrarSinVentas ? 'rotate-180' : ''}`} />
              </button>
              {mostrarSinVentas && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {resumen.productosSinVentas.map((p) => (
                    <span key={p.id} className="rounded-lg bg-white/5 px-2.5 py-1.5 text-sm text-muted">
                      {p.nombre}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Dashboard de tarjetas: cada venta con su desglose, sin tablas anchas
              que obliguen a hacer scroll horizontal en el celular. */}
          <div className="card p-4">
            <p className="mb-3 text-sm font-semibold text-white/80">Detalle de ventas del día</p>
            {resumen.ventasCompletas.length === 0 ? (
              <p className="text-sm text-muted">No hubo ventas este día.</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {resumen.ventasCompletas.map((v) => (
                  <div key={v.id} className="rounded-xl border border-white/8 bg-white/2 p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-white">{v.hora}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-white">${v.montoTotal.toLocaleString('es-CO')}</p>
                        <button
                          type="button"
                          onClick={() => handleEliminarVenta(v)}
                          disabled={eliminandoId === v.id}
                          className="rounded-md p-1 text-muted hover:bg-brand-700/15 hover:text-brand-400 disabled:opacity-50"
                          aria-label="Eliminar venta"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-muted">{v.mecanico}</span>
                      <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-muted capitalize">{v.metodoPago}</span>
                      <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-muted">Registró: {v.registrador}</span>
                    </div>
                    <ul className="space-y-0.5 text-xs text-white/70">
                      {[...v.productos, ...v.servicios].map((item, i) => (
                        <li key={i}>• {item}</li>
                      ))}
                      {v.productos.length === 0 && v.servicios.length === 0 && <li>—</li>}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>

          {cierreBlob ? (
            <ImagenGeneradaPreview
              blob={cierreBlob}
              nombreArchivo={`cierre-${fecha}.png`}
              textoCompartir={`Cierre del día ${fecha}`}
            />
          ) : (
            <button onClick={handleGenerarImagen} disabled={generando || resumen.numVentas === 0} className="btn-primary w-full">
              <Download size={16} />
              {generando ? 'Generando…' : 'Generar imagen de cierre'}
            </button>
          )}
        </div>
      )}

      <BarcodeScannerModal open={scannerOpen} onClose={() => setScannerOpen(false)} onDetected={handleEscaneado} />
    </div>
  )
}

function money(n) {
  return Number(n).toLocaleString('es-CO')
}
