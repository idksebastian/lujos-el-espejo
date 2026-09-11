import { useEffect, useState } from 'react'
import { TriangleAlert, Search, Camera, Receipt, X, Undo2, Pencil } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { rangoDiaLocal } from '../../lib/fechas'
import { useConfiguracion } from '../../contexts/ConfiguracionContext'
import { generarFacturaPng } from '../../lib/recibo'
import BarcodeScannerModal from '../../components/BarcodeScannerModal'
import ImagenGeneradaPreview from '../../components/ImagenGeneradaPreview'
import MoneyInput from '../../components/MoneyInput'

const TIPOS_DEVOLUCION = [
  { value: 'reparacion', label: 'Reparación gratuita', hint: 'Solo queda anotado. No mueve dinero ni stock.' },
  { value: 'cambio', label: 'Cambio por el mismo producto', hint: 'Sale 1 unidad más de stock. No mueve dinero.' },
  { value: 'dinero', label: 'Devolución de dinero', hint: 'Se descuenta del cierre del día, repartido entre los socios. El mecánico no devuelve nada.' },
]

const DEVOLUCION_VACIA = {
  abierta: false,
  venta: null,
  cargando: false,
  productos: [],
  existentes: [],
  tipo: 'reparacion',
  productoId: '',
  motivo: '',
  monto: '',
  guardando: false,
  error: '',
  exito: false,
}

const METODOS_PAGO = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'transferencia', label: 'Transferencia' },
]

const EDICION_VACIA = {
  abierta: false,
  venta: null,
  mecanicoId: '',
  metodoPago: 'efectivo',
  clienteNombre: '',
  ajusteFactura: false,
  montoFactura: '',
  guardando: false,
  error: '',
}

export default function HistorialVentasPage() {
  const { nombre_socio_1: nombreSocio1, nombre_socio_2: nombreSocio2 } = useConfiguracion()
  const [ventas, setVentas] = useState([])
  const [mecanicos, setMecanicos] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [filtros, setFiltros] = useState({ desde: '', hasta: '', mecanicoId: '', registradoPor: '' })
  const [busquedaFolio, setBusquedaFolio] = useState('')
  const [scannerOpen, setScannerOpen] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [factura, setFactura] = useState({ abierta: false, cargando: false, blob: null, folio: '', error: '' })
  const [devolucion, setDevolucion] = useState(DEVOLUCION_VACIA)
  const [edicion, setEdicion] = useState(EDICION_VACIA)

  useEffect(() => {
    supabase.from('mecanicos').select('id, nombre').order('nombre').then(({ data }) => setMecanicos(data ?? []))
    supabase
      .from('usuarios')
      .select('id, nombre_completo')
      .order('nombre_completo')
      .then(({ data }) => setUsuarios(data ?? []))
  }, [])

  useEffect(() => {
    cargarVentas()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros])

  async function cargarVentas() {
    setCargando(true)
    setError('')

    let query = supabase
      .from('ventas')
      .select(
        `id, fecha_hora, monto_total, monto_factura, costo_total, monto_mecanico, monto_duena, monto_socio,
         metodo_pago, cliente_nombre, mecanico_id, mecanico:mecanicos(nombre),
         registrador:usuarios(nombre_completo),
         venta_mecanicos_extra(monto, mecanico:mecanicos(nombre))`
      )
      .order('fecha_hora', { ascending: false })

    if (filtros.desde) query = query.gte('fecha_hora', rangoDiaLocal(filtros.desde).desde)
    if (filtros.hasta) query = query.lte('fecha_hora', rangoDiaLocal(filtros.hasta).hasta)
    if (filtros.mecanicoId) query = query.eq('mecanico_id', filtros.mecanicoId)
    if (filtros.registradoPor) query = query.eq('registrado_por', filtros.registradoPor)

    const { data, error } = await query
    if (error) setError(error.message)
    else setVentas(data ?? [])
    setCargando(false)
  }

  function setFiltro(campo, valor) {
    setFiltros((f) => ({ ...f, [campo]: valor }))
  }

  function handleEscaneado(codigo) {
    setScannerOpen(false)
    setBusquedaFolio(codigo)
  }

  async function handleVerFactura(venta) {
    const folio = venta.id.slice(0, 8).toUpperCase()
    setFactura({ abierta: true, cargando: true, blob: null, folio, error: '' })

    const { data, error } = await supabase
      .from('ventas')
      .select(
        `id, fecha_hora, monto_total, monto_factura, cliente_nombre,
         venta_productos(cantidad, producto:productos(nombre)),
         venta_servicios(descripcion, monto)`
      )
      .eq('id', venta.id)
      .single()

    if (error || !data) {
      setFactura((f) => ({ ...f, cargando: false, error: 'No se pudo cargar el detalle de esta venta.' }))
      return
    }

    try {
      const blob = await generarFacturaPng({
        folio,
        fecha: new Date(data.fecha_hora).toLocaleString('es-CO'),
        cliente: data.cliente_nombre,
        items: (data.venta_productos ?? []).map((p) => ({ nombre: p.producto?.nombre ?? '—', cantidad: p.cantidad })),
        servicios: (data.venta_servicios ?? []).map((s) => ({ descripcion: s.descripcion, monto: s.monto })),
        montoTotal: Number(data.monto_factura ?? data.monto_total),
        nit: null,
      })
      setFactura({ abierta: true, cargando: false, blob, folio, error: '' })
    } catch (err) {
      setFactura((f) => ({ ...f, cargando: false, error: 'No se pudo generar la imagen: ' + err.message }))
    }
  }

  async function handleAbrirDevolucion(venta) {
    setDevolucion({ ...DEVOLUCION_VACIA, abierta: true, cargando: true, venta })

    const [productosRes, existentesRes] = await Promise.all([
      supabase.from('venta_productos').select('cantidad, producto:productos(id, nombre)').eq('venta_id', venta.id),
      supabase
        .from('devoluciones')
        .select('tipo, motivo, monto_devuelto, fecha, producto:productos(nombre)')
        .eq('venta_id', venta.id)
        .order('fecha', { ascending: false }),
    ])

    setDevolucion((d) => ({
      ...d,
      cargando: false,
      productos: (productosRes.data ?? []).map((p) => p.producto).filter(Boolean),
      existentes: existentesRes.data ?? [],
    }))
  }

  function cerrarDevolucion() {
    setDevolucion(DEVOLUCION_VACIA)
  }

  async function handleGuardarDevolucion() {
    const { venta, tipo, productoId, motivo, monto } = devolucion
    if (tipo === 'cambio' && !productoId) {
      setDevolucion((d) => ({ ...d, error: 'Elige qué producto se cambia.' }))
      return
    }
    if (tipo === 'dinero' && (!monto || Number(monto) <= 0)) {
      setDevolucion((d) => ({ ...d, error: 'Indica el monto a devolver.' }))
      return
    }

    setDevolucion((d) => ({ ...d, guardando: true, error: '' }))

    const { error } = await supabase.rpc('registrar_devolucion', {
      p_venta_id: venta.id,
      p_producto_id: tipo === 'cambio' ? productoId : null,
      p_tipo: tipo,
      p_motivo: motivo,
      p_monto_devuelto: tipo === 'dinero' ? Number(monto) : 0,
    })

    if (error) {
      setDevolucion((d) => ({ ...d, guardando: false, error: error.message }))
      return
    }

    setDevolucion((d) => ({ ...d, guardando: false, exito: true }))
  }

  function handleAbrirEdicion(venta) {
    setEdicion({
      abierta: true,
      venta,
      mecanicoId: venta.mecanico_id ?? '',
      metodoPago: venta.metodo_pago,
      clienteNombre: venta.cliente_nombre ?? '',
      ajusteFactura: venta.monto_factura != null && Number(venta.monto_factura) !== Number(venta.monto_total),
      montoFactura: venta.monto_factura != null ? String(venta.monto_factura) : '',
      guardando: false,
      error: '',
    })
  }

  function cerrarEdicion() {
    setEdicion(EDICION_VACIA)
  }

  async function handleGuardarEdicion() {
    const { venta, mecanicoId, metodoPago, clienteNombre, ajusteFactura, montoFactura } = edicion
    if (ajusteFactura && (!montoFactura || Number(montoFactura) <= 0)) {
      return setEdicion((d) => ({ ...d, error: 'Indica el monto real que pagó el cliente.' }))
    }

    setEdicion((d) => ({ ...d, guardando: true, error: '' }))

    const { error } = await supabase.rpc('editar_venta', {
      p_venta_id: venta.id,
      p_mecanico_id: mecanicoId || null,
      p_metodo_pago: metodoPago,
      p_cliente_nombre: clienteNombre,
      p_monto_factura: ajusteFactura && montoFactura ? Number(montoFactura) : null,
    })

    if (error) {
      setEdicion((d) => ({ ...d, guardando: false, error: error.message }))
      return
    }

    cerrarEdicion()
    cargarVentas()
  }

  const folioNormalizado = busquedaFolio.trim().toUpperCase()
  const ventasFiltradas = folioNormalizado
    ? ventas.filter((v) => v.id.slice(0, 8).toUpperCase().includes(folioNormalizado))
    : ventas
  const totalFiltrado = ventasFiltradas.reduce((sum, v) => sum + Number(v.monto_total), 0)

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="font-display text-2xl text-white">Historial de ventas</h1>

      <div className="card p-4">
        <span className="mb-1 block text-xs uppercase tracking-wide text-muted">
          Buscar por folio (el código de la factura — útil para devoluciones)
        </span>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={busquedaFolio}
              onChange={(e) => setBusquedaFolio(e.target.value)}
              placeholder="Ej. 4D59F7D0"
              className="input pl-9 uppercase"
            />
          </div>
          <button type="button" onClick={() => setScannerOpen(true)} className="btn-secondary shrink-0">
            <Camera size={16} />
            Escanear
          </button>
        </div>
      </div>

      <div className="card grid grid-cols-2 gap-2 p-4 sm:grid-cols-4">
        <label className="block">
          <span className="mb-1 block text-xs uppercase tracking-wide text-muted">Desde</span>
          <input type="date" value={filtros.desde} onChange={(e) => setFiltro('desde', e.target.value)} className="input" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs uppercase tracking-wide text-muted">Hasta</span>
          <input type="date" value={filtros.hasta} onChange={(e) => setFiltro('hasta', e.target.value)} className="input" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs uppercase tracking-wide text-muted">Mecánico</span>
          <select value={filtros.mecanicoId} onChange={(e) => setFiltro('mecanicoId', e.target.value)} className="input">
            <option value="">Todos</option>
            {mecanicos.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs uppercase tracking-wide text-muted">Registrado por</span>
          <select value={filtros.registradoPor} onChange={(e) => setFiltro('registradoPor', e.target.value)} className="input">
            <option value="">Todos</option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nombre_completo}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && (
        <p className="flex items-center gap-2 rounded-lg bg-brand-700/15 px-3 py-2 text-sm text-brand-400 ring-1 ring-brand-700/30">
          <TriangleAlert size={16} className="shrink-0" />
          {error}
        </p>
      )}

      {cargando ? (
        <p className="text-sm text-muted">Cargando…</p>
      ) : (
        <>
          <p className="text-sm text-muted">
            {ventasFiltradas.length} venta{ventasFiltradas.length !== 1 && 's'} · Total $
            {totalFiltrado.toLocaleString('es-CO')}
          </p>
          <ul className="card divide-y divide-white/8 overflow-hidden">
            {ventasFiltradas.map((v) => (
              <li key={v.id} className="px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white">{new Date(v.fecha_hora).toLocaleString('es-CO')}</p>
                    <p className="text-xs text-muted">
                      Folio: <span className="font-mono">{v.id.slice(0, 8).toUpperCase()}</span> · Mecánico
                      {v.venta_mecanicos_extra?.length > 0 && 's'}: {v.mecanico?.nombre ?? '—'}
                      {v.venta_mecanicos_extra?.map((e, i) => (
                        <span key={i}>, {e.mecanico?.nombre ?? '—'}</span>
                      ))}{' '}
                      · Pago: {v.metodo_pago} · Registró: {v.registrador?.nombre_completo ?? '—'}
                      {v.cliente_nombre && ` · Cliente: ${v.cliente_nombre}`}
                    </p>
                    <p className="text-xs text-muted/70">
                      Costo ${Number(v.costo_total).toLocaleString('es-CO')} · {v.mecanico?.nombre ?? 'Mecánico'} $
                      {Number(v.monto_mecanico).toLocaleString('es-CO')}
                      {v.venta_mecanicos_extra?.map((e, i) => (
                        <span key={i}>
                          {' '}
                          · {e.mecanico?.nombre ?? 'Mecánico'} ${Number(e.monto).toLocaleString('es-CO')}
                        </span>
                      ))}{' '}
                      · {nombreSocio1} ${Number(v.monto_duena).toLocaleString('es-CO')} · {nombreSocio2} $
                      {Number(v.monto_socio).toLocaleString('es-CO')}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <p className="text-sm font-semibold text-white">${Number(v.monto_total).toLocaleString('es-CO')}</p>
                    {v.monto_factura != null && Number(v.monto_factura) !== Number(v.monto_total) && (
                      <p className="text-xs text-amber-400">Factura: ${Number(v.monto_factura).toLocaleString('es-CO')}</p>
                    )}
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleVerFactura(v)}
                        className="flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 text-xs text-white/70 hover:bg-white/8 hover:text-white"
                      >
                        <Receipt size={13} />
                        Factura
                      </button>
                      <button
                        onClick={() => handleAbrirDevolucion(v)}
                        className="flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 text-xs text-white/70 hover:bg-white/8 hover:text-white"
                      >
                        <Undo2 size={13} />
                        Devolución
                      </button>
                      <button
                        onClick={() => handleAbrirEdicion(v)}
                        className="flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 text-xs text-white/70 hover:bg-white/8 hover:text-white"
                      >
                        <Pencil size={13} />
                        Editar
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
            {ventasFiltradas.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-muted">Sin resultados</li>
            )}
          </ul>
        </>
      )}

      <BarcodeScannerModal open={scannerOpen} onClose={() => setScannerOpen(false)} onDetected={handleEscaneado} />

      {factura.abierta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/8 bg-surface p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-base text-white">Factura {factura.folio}</h2>
              <button
                onClick={() => setFactura({ abierta: false, cargando: false, blob: null, folio: '', error: '' })}
                className="rounded-lg p-1 text-muted hover:bg-white/8 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {factura.cargando && <p className="text-sm text-muted">Generando…</p>}
            {factura.error && (
              <p className="flex items-center gap-2 rounded-lg bg-brand-700/15 px-3 py-2 text-sm text-brand-400 ring-1 ring-brand-700/30">
                <TriangleAlert size={16} className="shrink-0" />
                {factura.error}
              </p>
            )}
            {factura.blob && (
              <ImagenGeneradaPreview
                blob={factura.blob}
                nombreArchivo={`factura-${factura.folio}.png`}
                textoCompartir="Factura Lujos El Espejo"
              />
            )}
          </div>
        </div>
      )}

      {devolucion.abierta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-2xl border border-white/8 bg-surface p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-base text-white">
                Devolución — {devolucion.venta?.id.slice(0, 8).toUpperCase()}
              </h2>
              <button onClick={cerrarDevolucion} className="rounded-lg p-1 text-muted hover:bg-white/8 hover:text-white">
                <X size={18} />
              </button>
            </div>

            {devolucion.cargando ? (
              <p className="text-sm text-muted">Cargando…</p>
            ) : devolucion.exito ? (
              <div className="space-y-3">
                <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400 ring-1 ring-emerald-500/30">
                  Devolución registrada.
                </p>
                <button onClick={cerrarDevolucion} className="btn-primary w-full">
                  Cerrar
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {devolucion.existentes.length > 0 && (
                  <div className="rounded-lg border border-white/10 p-2.5">
                    <p className="mb-1.5 text-xs uppercase tracking-wide text-muted">Ya registradas en esta venta</p>
                    <ul className="space-y-1 text-xs text-white/70">
                      {devolucion.existentes.map((e, i) => (
                        <li key={i}>
                          {new Date(e.fecha).toLocaleDateString('es-CO')} —{' '}
                          {TIPOS_DEVOLUCION.find((t) => t.value === e.tipo)?.label ?? e.tipo}
                          {e.producto?.nombre && ` (${e.producto.nombre})`}
                          {e.tipo === 'dinero' && ` — $${Number(e.monto_devuelto).toLocaleString('es-CO')}`}
                          {e.motivo && ` — ${e.motivo}`}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <label className="block">
                  <span className="mb-1 block text-xs uppercase tracking-wide text-muted">Tipo</span>
                  <select
                    value={devolucion.tipo}
                    onChange={(e) => setDevolucion((d) => ({ ...d, tipo: e.target.value, error: '' }))}
                    className="input"
                  >
                    {TIPOS_DEVOLUCION.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  <span className="mt-1 block text-xs text-muted/80">
                    {TIPOS_DEVOLUCION.find((t) => t.value === devolucion.tipo)?.hint}
                  </span>
                </label>

                {devolucion.tipo === 'cambio' && (
                  <label className="block">
                    <span className="mb-1 block text-xs uppercase tracking-wide text-muted">Producto que se cambia</span>
                    <select
                      value={devolucion.productoId}
                      onChange={(e) => setDevolucion((d) => ({ ...d, productoId: e.target.value, error: '' }))}
                      className="input"
                    >
                      <option value="">Selecciona…</option>
                      {devolucion.productos.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nombre}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                {devolucion.tipo === 'dinero' && (
                  <label className="block">
                    <span className="mb-1 block text-xs uppercase tracking-wide text-muted">Monto a devolver</span>
                    <MoneyInput
                      value={devolucion.monto}
                      onChange={(v) => setDevolucion((d) => ({ ...d, monto: v, error: '' }))}
                    />
                  </label>
                )}

                <label className="block">
                  <span className="mb-1 block text-xs uppercase tracking-wide text-muted">Motivo (opcional)</span>
                  <textarea
                    value={devolucion.motivo}
                    onChange={(e) => setDevolucion((d) => ({ ...d, motivo: e.target.value }))}
                    rows={2}
                    className="input resize-none"
                    placeholder="Ej. producto defectuoso, no encendía…"
                  />
                </label>

                {devolucion.error && (
                  <p className="flex items-center gap-2 rounded-lg bg-brand-700/15 px-3 py-2 text-sm text-brand-400 ring-1 ring-brand-700/30">
                    <TriangleAlert size={16} className="shrink-0" />
                    {devolucion.error}
                  </p>
                )}

                <button onClick={handleGuardarDevolucion} disabled={devolucion.guardando} className="btn-primary w-full">
                  {devolucion.guardando ? 'Guardando…' : 'Registrar devolución'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {edicion.abierta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/8 bg-surface p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-base text-white">
                Editar venta — {edicion.venta?.id.slice(0, 8).toUpperCase()}
              </h2>
              <button onClick={cerrarEdicion} className="rounded-lg p-1 text-muted hover:bg-white/8 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <p className="mb-3 text-xs text-muted">
              Solo se puede corregir el mecánico, método de pago, cliente y monto de factura — el monto total y los
              productos de una venta ya registrada no se editan aquí. Si el monto o los productos están mal, usa
              "Devolución" en su lugar.
            </p>

            <div className="space-y-3">
              <label className="block">
                <span className="mb-1 block text-xs uppercase tracking-wide text-muted">Mecánico</span>
                <select
                  value={edicion.mecanicoId}
                  onChange={(e) => setEdicion((d) => ({ ...d, mecanicoId: e.target.value, error: '' }))}
                  className="input"
                >
                  <option value="">Ninguno (venta sin instalación)</option>
                  {mecanicos.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nombre}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs uppercase tracking-wide text-muted">Método de pago</span>
                <select
                  value={edicion.metodoPago}
                  onChange={(e) => setEdicion((d) => ({ ...d, metodoPago: e.target.value }))}
                  className="input"
                >
                  {METODOS_PAGO.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs uppercase tracking-wide text-muted">Cliente (opcional)</span>
                <input
                  value={edicion.clienteNombre}
                  onChange={(e) => setEdicion((d) => ({ ...d, clienteNombre: e.target.value }))}
                  className="input"
                  placeholder="Nombre del cliente"
                />
              </label>

              {edicion.ajusteFactura ? (
                <label className="block">
                  <span className="mb-1 block text-xs uppercase tracking-wide text-muted">
                    Monto real que pagó el cliente (va en la factura)
                  </span>
                  <MoneyInput
                    value={edicion.montoFactura}
                    onChange={(v) => setEdicion((d) => ({ ...d, montoFactura: v, error: '' }))}
                  />
                  <button
                    type="button"
                    onClick={() => setEdicion((d) => ({ ...d, ajusteFactura: false, montoFactura: '' }))}
                    className="mt-1 text-[11px] text-white/50 underline decoration-dotted hover:text-white"
                  >
                    Cancelar, es el mismo monto
                  </button>
                </label>
              ) : (
                <button
                  type="button"
                  onClick={() => setEdicion((d) => ({ ...d, ajusteFactura: true }))}
                  className="text-[11px] text-white/50 underline decoration-dotted hover:text-white"
                >
                  ¿El cliente pagó un monto distinto al registrado?
                </button>
              )}

              {edicion.error && (
                <p className="flex items-center gap-2 rounded-lg bg-brand-700/15 px-3 py-2 text-sm text-brand-400 ring-1 ring-brand-700/30">
                  <TriangleAlert size={16} className="shrink-0" />
                  {edicion.error}
                </p>
              )}

              <button onClick={handleGuardarEdicion} disabled={edicion.guardando} className="btn-primary w-full">
                {edicion.guardando ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
