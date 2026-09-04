import { useEffect, useState } from 'react'
import { Camera, Trash2, CheckCircle2, Receipt, TriangleAlert, Plus, Wrench, Truck, ChevronDown } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { calcularReparto } from '../../lib/reparto'
import { generarFacturaPng } from '../../lib/recibo'
import BarcodeScannerModal from '../../components/BarcodeScannerModal'
import ProductoAutocomplete from '../../components/ProductoAutocomplete'
import ImagenGeneradaPreview from '../../components/ImagenGeneradaPreview'
import MoneyInput from '../../components/MoneyInput'
import { useConfiguracion } from '../../contexts/ConfiguracionContext'

const METODOS_PAGO = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'transferencia', label: 'Transferencia' },
]

export default function NuevaVentaPage() {
  const { nombre_socio_1: nombreSocio1, nombre_socio_2: nombreSocio2, nit_socio_1: nitSocio1, nit_socio_2: nitSocio2 } =
    useConfiguracion()
  const [mecanicos, setMecanicos] = useState([])
  const [items, setItems] = useState([])
  const [montoTotal, setMontoTotal] = useState('')
  const [mecanicoIds, setMecanicoIds] = useState([])
  const [mecanicoMontos, setMecanicoMontos] = useState({})
  const [metodoPago, setMetodoPago] = useState('efectivo')
  const [clienteNombre, setClienteNombre] = useState('')
  const [scannerOpen, setScannerOpen] = useState(false)
  const [error, setError] = useState('')
  const [avisoScan, setAvisoScan] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [ventaConfirmada, setVentaConfirmada] = useState(null)
  const [generandoFactura, setGenerandoFactura] = useState(false)
  const [facturaBlob, setFacturaBlob] = useState(null)
  const [pagaCon, setPagaCon] = useState('')
  const [nitElegido, setNitElegido] = useState('')
  const [servicios, setServicios] = useState([])
  const [nuevoServicioDesc, setNuevoServicioDesc] = useState('')
  const [nuevoServicioMonto, setNuevoServicioMonto] = useState('')
  const [ajusteFactura, setAjusteFactura] = useState(false)
  const [montoFactura, setMontoFactura] = useState('')
  const [externos, setExternos] = useState([])
  const [nuevoExternoDesc, setNuevoExternoDesc] = useState('')
  const [nuevoExternoCosto, setNuevoExternoCosto] = useState('')
  const [nuevoExternoPrecio, setNuevoExternoPrecio] = useState('')
  const [nuevoExternoReparto, setNuevoExternoReparto] = useState('ambos')
  const [serviciosAbierto, setServiciosAbierto] = useState(false)
  const [externosAbierto, setExternosAbierto] = useState(false)

  useEffect(() => {
    supabase
      .from('mecanicos')
      .select('id, nombre')
      .eq('activo', true)
      .order('nombre')
      .then(({ data }) => setMecanicos(data ?? []))
  }, [])

  function agregarProducto(producto) {
    setError('')
    setItems((prev) => {
      const existente = prev.find((it) => it.producto_id === producto.id)
      if (existente) {
        return prev.map((it) =>
          it.producto_id === producto.id ? { ...it, cantidad: it.cantidad + 1 } : it
        )
      }
      return [
        ...prev,
        {
          producto_id: producto.id,
          nombre: producto.nombre,
          costo: Number(producto.costo),
          precioSugerido: producto.precio_sugerido != null ? Number(producto.precio_sugerido) : null,
          stockDisponible: producto.stock_actual,
          cantidad: 1,
        },
      ]
    })
  }

  async function handleEscaneado(codigo) {
    setScannerOpen(false)
    setAvisoScan('')
    const { data, error } = await supabase
      .from('productos')
      .select('id, nombre, costo, precio_sugerido, stock_actual')
      .eq('codigo_barras', codigo)
      .eq('activo', true)
      .maybeSingle()

    if (error || !data) {
      setAvisoScan('No se encontró ningún producto activo con ese código.')
      return
    }
    agregarProducto(data)
  }

  function actualizarCantidad(productoId, cantidad) {
    const n = Number(cantidad)
    setItems((prev) =>
      prev.map((it) => (it.producto_id === productoId ? { ...it, cantidad: Number.isFinite(n) && n > 0 ? n : 1 } : it))
    )
  }

  function quitarProducto(productoId) {
    setItems((prev) => prev.filter((it) => it.producto_id !== productoId))
  }

  function agregarServicio() {
    const descripcion = nuevoServicioDesc.trim()
    const monto = Number(nuevoServicioMonto)
    setError('')

    if (!descripcion) return setError('Escribe una descripción para el servicio especial')
    if (!Number.isFinite(monto) || monto < 0) return setError('El monto del servicio debe ser un número válido')

    setServicios((prev) => [...prev, { id: crypto.randomUUID(), descripcion, monto }])
    setNuevoServicioDesc('')
    setNuevoServicioMonto('')
  }

  function quitarServicio(id) {
    setServicios((prev) => prev.filter((s) => s.id !== id))
  }

  function agregarExterno() {
    const descripcion = nuevoExternoDesc.trim()
    const costo = Number(nuevoExternoCosto) || 0
    const precioVenta = Number(nuevoExternoPrecio)
    setError('')

    if (!descripcion) return setError('Escribe una descripción para el repuesto/trabajo externo')
    if (!Number.isFinite(precioVenta) || precioVenta < 0) return setError('El precio de venta debe ser un número válido')

    setExternos((prev) => [
      ...prev,
      { id: crypto.randomUUID(), descripcion, costo, precioVenta, reparto: nuevoExternoReparto },
    ])
    setNuevoExternoDesc('')
    setNuevoExternoCosto('')
    setNuevoExternoPrecio('')
    setNuevoExternoReparto('ambos')
  }

  function quitarExterno(id) {
    setExternos((prev) => prev.filter((e) => e.id !== id))
  }

  function toggleMecanico(id) {
    setError('')
    setMecanicoIds((prev) => {
      if (prev.includes(id)) {
        setMecanicoMontos((m) => {
          const { [id]: _quitado, ...resto } = m
          return resto
        })
        return prev.filter((x) => x !== id)
      }
      return [...prev, id]
    })
  }

  const costoTotal = items.reduce((sum, it) => sum + it.costo * it.cantidad, 0)
  const montoTotalNum = Number(montoTotal) || 0
  const preview = calcularReparto(montoTotalNum, costoTotal)
  const montoFacturaNum = Number(montoFactura) || 0
  const montoCobrado = ajusteFactura && montoFacturaNum > 0 ? montoFacturaNum : montoTotalNum
  const pagaConNum = Number(pagaCon) || 0
  const vuelto = pagaConNum - montoCobrado

  // Cuando hay 2+ mecánicos: todos menos el último tienen un monto propio
  // (el "chanchullo" de Santiago, por ejemplo); el último se lleva lo que
  // sobra del total a repartir entre mecánicos — así la suma siempre cuadra
  // exacto sin que el usuario tenga que calcular nada.
  const mecanicosConMonto =
    mecanicoIds.length > 1
      ? (() => {
          const explicitos = mecanicoIds.slice(0, -1)
          const sumaExplicitos = explicitos.reduce((s, id) => s + (Number(mecanicoMontos[id]) || 0), 0)
          const idResto = mecanicoIds[mecanicoIds.length - 1]
          return [
            ...explicitos.map((id) => ({ id, monto: Number(mecanicoMontos[id]) || 0, editable: true })),
            { id: idResto, monto: Math.max(preview.montoMecanico - sumaExplicitos, 0), editable: false },
          ]
        })()
      : []

  function resetFormulario() {
    setItems([])
    setServicios([])
    setNuevoServicioDesc('')
    setNuevoServicioMonto('')
    setExternos([])
    setNuevoExternoDesc('')
    setNuevoExternoCosto('')
    setNuevoExternoPrecio('')
    setNuevoExternoReparto('ambos')
    setMontoTotal('')
    setMecanicoIds([])
    setMecanicoMontos({})
    setMetodoPago('efectivo')
    setClienteNombre('')
    setVentaConfirmada(null)
    setFacturaBlob(null)
    setPagaCon('')
    setNitElegido('')
    setError('')
    setAvisoScan('')
    setAjusteFactura(false)
    setMontoFactura('')
  }

  async function handleConfirmar(e) {
    e.preventDefault()
    setError('')

    if (items.length === 0 && servicios.length === 0 && externos.length === 0) {
      return setError('Agrega al menos un producto, un servicio especial o un repuesto externo a la venta')
    }
    if (!montoTotalNum || montoTotalNum <= 0) return setError('El monto total pagado debe ser mayor a $0')
    if (mecanicoIds.length === 0) return setError('Selecciona el o los mecánicos que atendieron esta venta')
    if (ajusteFactura && montoFacturaNum <= 0) return setError('Indica el monto real que pagó el cliente')

    if (mecanicoIds.length > 1) {
      const sumaMecanicos = mecanicosConMonto.reduce((s, m) => s + m.monto, 0)
      if (Math.round(sumaMecanicos * 100) !== Math.round(preview.montoMecanico * 100)) {
        return setError('Los montos de los mecánicos no cuadran con el total a repartir entre mecánicos')
      }
      const negativo = mecanicosConMonto.find((m) => m.monto < 0)
      if (negativo) return setError('Los montos asignados a los mecánicos superan lo que hay para repartir')
    }

    const excedeStock = items.find((it) => it.cantidad > it.stockDisponible)
    if (excedeStock) {
      return setError(`No hay suficiente stock de "${excedeStock.nombre}" (disponible: ${excedeStock.stockDisponible})`)
    }

    // El último mecánico seleccionado es quien recibe "el resto" del total
    // a repartir entre mecánicos; los demás llevan un monto propio (el
    // "chanchullo" de turno). Con un solo mecánico, es exactamente lo de
    // siempre: se lleva el 100% del cálculo automático.
    const mecanicoIdPrincipal = mecanicoIds[mecanicoIds.length - 1]
    const mecanicosExtra =
      mecanicoIds.length > 1
        ? mecanicosConMonto.filter((m) => m.editable).map((m) => ({ mecanico_id: m.id, monto: m.monto }))
        : []

    setEnviando(true)
    try {
      const { data: ventaId, error } = await supabase.rpc('registrar_venta', {
        p_monto_total: montoTotalNum,
        p_mecanico_id: mecanicoIdPrincipal,
        p_metodo_pago: metodoPago,
        p_cliente_nombre: clienteNombre || null,
        p_items: items.map((it) => ({ producto_id: it.producto_id, cantidad: it.cantidad })),
        p_servicios: servicios.map((s) => ({ descripcion: s.descripcion, monto: s.monto })),
        p_monto_factura: ajusteFactura && montoFacturaNum > 0 ? montoFacturaNum : null,
        p_externos: externos.map((ex) => ({
          descripcion: ex.descripcion,
          costo: ex.costo,
          precio_venta: ex.precioVenta,
          reparto_gasto: ex.reparto,
        })),
        p_mecanicos_extra: mecanicosExtra,
      })

      if (error) throw error

      setVentaConfirmada({
        id: ventaId,
        fecha: new Date(),
        cliente: clienteNombre,
        items: items.map((it) => ({ nombre: it.nombre, cantidad: it.cantidad })),
        servicios: [
          ...servicios.map((s) => ({ descripcion: s.descripcion, monto: s.monto })),
          ...externos.map((ex) => ({ descripcion: ex.descripcion, monto: ex.precioVenta })),
        ],
        montoTotal: montoCobrado,
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setEnviando(false)
    }
  }

  async function handleGenerarFactura() {
    setGenerandoFactura(true)
    try {
      const nit =
        nitElegido === 'socio1'
          ? { nombre: nombreSocio1, numero: nitSocio1 }
          : nitElegido === 'socio2'
            ? { nombre: nombreSocio2, numero: nitSocio2 }
            : null

      const blob = await generarFacturaPng({
        folio: ventaConfirmada.id.slice(0, 8).toUpperCase(),
        fecha: ventaConfirmada.fecha.toLocaleString('es-CO'),
        cliente: ventaConfirmada.cliente,
        items: ventaConfirmada.items,
        servicios: ventaConfirmada.servicios,
        montoTotal: ventaConfirmada.montoTotal,
        nit,
      })
      setFacturaBlob(blob)
    } catch (err) {
      setError('No se pudo generar la imagen de la factura: ' + err.message)
    } finally {
      setGenerandoFactura(false)
    }
  }

  if (ventaConfirmada) {
    return (
      <div className="mx-auto max-w-md space-y-4 text-center">
        <div className="card flex flex-col items-center gap-2 border-emerald-900/40 bg-emerald-950/40 px-4 py-6">
          <CheckCircle2 size={28} className="text-emerald-400" />
          <p className="font-display text-xl text-emerald-300">¡Venta registrada!</p>
          <p className="text-sm text-emerald-400/80">Total: ${ventaConfirmada.montoTotal.toLocaleString('es-CO')}</p>
        </div>

        {!facturaBlob && (nitSocio1 || nitSocio2) && (
          <label className="block text-left">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted">
              Incluir NIT en la factura (si el cliente lo pide)
            </span>
            <select value={nitElegido} onChange={(e) => setNitElegido(e.target.value)} className="input">
              <option value="">Ninguno</option>
              {nitSocio1 && <option value="socio1">{nombreSocio1} — {nitSocio1}</option>}
              {nitSocio2 && <option value="socio2">{nombreSocio2} — {nitSocio2}</option>}
            </select>
          </label>
        )}

        {facturaBlob ? (
          <ImagenGeneradaPreview
            blob={facturaBlob}
            nombreArchivo={`factura-${ventaConfirmada.id.slice(0, 8)}.png`}
            textoCompartir="Factura Lujos El Espejo"
          />
        ) : (
          <button onClick={handleGenerarFactura} disabled={generandoFactura} className="btn-primary w-full">
            <Receipt size={16} />
            {generandoFactura ? 'Generando…' : 'Generar factura'}
          </button>
        )}

        <button onClick={resetFormulario} className="btn-secondary w-full">
          Nueva venta
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <h1 className="font-display text-2xl text-white">Nueva venta</h1>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1fr_340px]">
      <div className="space-y-5">
      <section className="card space-y-3 p-4">
        <p className="text-sm font-medium text-white/80">Productos</p>

        <div className="flex gap-2">
          <div className="flex-1">
            <ProductoAutocomplete onSelect={agregarProducto} />
          </div>
          <button type="button" onClick={() => setScannerOpen(true)} className="btn-secondary shrink-0">
            <Camera size={16} />
            Escanear
          </button>
        </div>

        {avisoScan && (
          <p className="flex items-center gap-1.5 text-xs text-amber-400">
            <TriangleAlert size={13} />
            {avisoScan}
          </p>
        )}

        {items.length > 0 && (
          <ul className="divide-y divide-white/8 overflow-hidden rounded-lg border border-white/8">
            {items.map((it) => {
              const excede = it.cantidad > it.stockDisponible
              return (
                <li key={it.producto_id} className="bg-black/20 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="min-w-0 flex-1 truncate text-sm text-white">
                      {it.nombre}
                      {it.precioSugerido != null && (
                        <span className="ml-1.5 text-xs text-emerald-400">
                          ${it.precioSugerido.toLocaleString('es-CO')} c/u
                        </span>
                      )}
                    </span>
                    <input
                      type="number"
                      min="1"
                      value={it.cantidad}
                      onChange={(e) => actualizarCantidad(it.producto_id, e.target.value)}
                      onWheel={(e) => e.currentTarget.blur()}
                      className={`w-16 rounded-md border bg-surface-2 px-2 py-1 text-center text-sm text-white ${
                        excede ? 'border-brand-600' : 'border-white/10'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => quitarProducto(it.producto_id)}
                      className="rounded-lg p-1.5 text-brand-400 hover:bg-brand-700/15"
                      aria-label="Quitar"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  {excede && (
                    <p className="mt-1 text-xs text-brand-400">Solo hay {it.stockDisponible} disponibles</p>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section className="card divide-y divide-white/8 overflow-hidden">
        <div>
          <button
            type="button"
            onClick={() => setServiciosAbierto((v) => !v)}
            className="flex w-full items-center justify-between gap-2 px-4 py-3"
          >
            <span className="flex items-center gap-1.5 text-sm font-medium text-white/80">
              <Wrench size={15} className="text-muted" />
              Servicios especiales
              {servicios.length > 0 && (
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/70">
                  {servicios.length} · ${servicios.reduce((s, x) => s + x.monto, 0).toLocaleString('es-CO')}
                </span>
              )}
            </span>
            <ChevronDown size={16} className={`text-muted transition-transform ${serviciosAbierto ? 'rotate-180' : ''}`} />
          </button>

          {serviciosAbierto && (
            <div className="space-y-3 px-4 pb-4">
              <p className="text-xs text-muted">
                Trabajos sueltos aparte de los productos (ej. arreglar algo que no se compró en la tienda).
              </p>

              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  value={nuevoServicioDesc}
                  onChange={(e) => setNuevoServicioDesc(e.target.value)}
                  placeholder="Ej. Arreglar bisagra de puerta"
                  className="input flex-1"
                />
                <MoneyInput
                  value={nuevoServicioMonto}
                  onChange={setNuevoServicioMonto}
                  placeholder="Monto"
                  className="sm:w-32"
                />
                <button type="button" onClick={agregarServicio} className="btn-secondary shrink-0">
                  <Plus size={16} />
                  Agregar
                </button>
              </div>

              {servicios.length > 0 && (
                <ul className="divide-y divide-white/8 overflow-hidden rounded-lg border border-white/8">
                  {servicios.map((s) => (
                    <li key={s.id} className="flex items-center justify-between gap-2 bg-black/20 px-3 py-2">
                      <span className="min-w-0 flex-1 truncate text-sm text-white">{s.descripcion}</span>
                      <span className="shrink-0 text-sm text-white/80">${s.monto.toLocaleString('es-CO')}</span>
                      <button
                        type="button"
                        onClick={() => quitarServicio(s.id)}
                        className="rounded-lg p-1.5 text-brand-400 hover:bg-brand-700/15"
                        aria-label="Quitar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <div>
          <button
            type="button"
            onClick={() => setExternosAbierto((v) => !v)}
            className="flex w-full items-center justify-between gap-2 px-4 py-3"
          >
            <span className="flex items-center gap-1.5 text-sm font-medium text-white/80">
              <Truck size={15} className="text-muted" />
              Repuestos o trabajo comprado afuera
              {externos.length > 0 && (
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/70">
                  {externos.length} · ${externos.reduce((s, x) => s + x.precioVenta, 0).toLocaleString('es-CO')}
                </span>
              )}
            </span>
            <ChevronDown size={16} className={`text-muted transition-transform ${externosAbierto ? 'rotate-180' : ''}`} />
          </button>

          {externosAbierto && (
            <div className="space-y-3 px-4 pb-4">
              <p className="text-xs text-muted">
                Repuesto de otro local o mecánico externo: cuánto costó allá (se registra como gasto) y a cuánto se vende aquí.
              </p>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <input
                  value={nuevoExternoDesc}
                  onChange={(e) => setNuevoExternoDesc(e.target.value)}
                  placeholder="Ej. Espejo traído de otro local"
                  className="input sm:col-span-2"
                />
                <label className="block">
                  <span className="mb-1 block text-[11px] uppercase tracking-wide text-muted">Costó allá</span>
                  <MoneyInput value={nuevoExternoCosto} onChange={setNuevoExternoCosto} placeholder="0" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[11px] uppercase tracking-wide text-muted">Se vende aquí en</span>
                  <MoneyInput value={nuevoExternoPrecio} onChange={setNuevoExternoPrecio} placeholder="0" />
                </label>
                <label className="block sm:col-span-2">
                  <span className="mb-1 block text-[11px] uppercase tracking-wide text-muted">
                    ¿A quién se le descuenta el costo?
                  </span>
                  <select value={nuevoExternoReparto} onChange={(e) => setNuevoExternoReparto(e.target.value)} className="input">
                    <option value="ambos">Ambos socios (50/50)</option>
                    <option value="socio1">Solo {nombreSocio1}</option>
                    <option value="socio2">Solo {nombreSocio2}</option>
                  </select>
                </label>
                <button type="button" onClick={agregarExterno} className="btn-secondary sm:col-span-2">
                  <Plus size={16} />
                  Agregar
                </button>
              </div>

              {externos.length > 0 && (
                <ul className="divide-y divide-white/8 overflow-hidden rounded-lg border border-white/8">
                  {externos.map((ex) => (
                    <li key={ex.id} className="flex items-center justify-between gap-2 bg-black/20 px-3 py-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-white">{ex.descripcion}</p>
                        <p className="text-xs text-muted">Costó ${ex.costo.toLocaleString('es-CO')}</p>
                      </div>
                      <span className="shrink-0 text-sm text-white/80">${ex.precioVenta.toLocaleString('es-CO')}</span>
                      <button
                        type="button"
                        onClick={() => quitarExterno(ex.id)}
                        className="rounded-lg p-1.5 text-brand-400 hover:bg-brand-700/15"
                        aria-label="Quitar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </section>

      <form onSubmit={handleConfirmar} className="card space-y-4 p-4">
        <label className="block">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted">
            Monto total pagado por el cliente
          </span>
          <MoneyInput value={montoTotal} onChange={setMontoTotal} placeholder="0" />
          <span className="mt-1 block text-[11px] text-muted">Esto es lo que se usa para repartir la ganancia.</span>
        </label>

        {ajusteFactura ? (
          <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted">
              Monto real que pagó el cliente (va en la factura)
            </span>
            <MoneyInput value={montoFactura} onChange={setMontoFactura} placeholder="0" />
            <button
              type="button"
              onClick={() => {
                setAjusteFactura(false)
                setMontoFactura('')
              }}
              className="mt-1 text-[11px] text-white/50 underline decoration-dotted hover:text-white"
            >
              Cancelar, es el mismo monto
            </button>
          </label>
        ) : (
          <button
            type="button"
            onClick={() => setAjusteFactura(true)}
            className="text-[11px] text-white/50 underline decoration-dotted hover:text-white"
          >
            ¿El cliente pagó un monto distinto al de arriba?
          </button>
        )}

        <div>
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted">
            Mecánico{mecanicoIds.length > 1 && 's'}
          </span>
          <div className="flex flex-wrap gap-2">
            {mecanicos.map((m) => {
              const seleccionado = mecanicoIds.includes(m.id)
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggleMecanico(m.id)}
                  className={`rounded-full border px-3 py-1.5 text-sm transition ${
                    seleccionado ? 'border-brand-600 bg-brand-600/15 text-white' : 'border-white/10 text-white/60 hover:text-white'
                  }`}
                >
                  {m.nombre}
                </button>
              )
            })}
          </div>
          {mecanicoIds.length === 0 && (
            <p className="mt-1.5 text-[11px] text-muted">Selecciona uno; si dos trabajaron en el arreglo, elige ambos.</p>
          )}

          {mecanicoIds.length > 1 && (
            <div className="mt-3 space-y-2 rounded-lg border border-white/10 p-3">
              <p className="text-[11px] text-muted">
                Cuánto le corresponde a cada uno — total a repartir entre mecánicos: $
                {preview.montoMecanico.toLocaleString('es-CO')}
              </p>
              {mecanicosConMonto.map((m) => {
                const nombre = mecanicos.find((mec) => mec.id === m.id)?.nombre ?? '—'
                return (
                  <div key={m.id} className="flex items-center justify-between gap-2">
                    <span className="text-sm text-white">
                      {nombre}
                      {!m.editable && <span className="text-muted"> (recibe el resto)</span>}
                    </span>
                    {m.editable ? (
                      <MoneyInput
                        value={mecanicoMontos[m.id] ?? ''}
                        onChange={(v) => setMecanicoMontos((prev) => ({ ...prev, [m.id]: v }))}
                        placeholder="0"
                        className="w-32"
                      />
                    ) : (
                      <span className={`text-sm font-medium ${m.monto < 0 ? 'text-brand-400' : 'text-white'}`}>
                        ${m.monto.toLocaleString('es-CO')}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <label className="block">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted">Método de pago</span>
          <select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)} className="input">
            {METODOS_PAGO.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted">Cliente (opcional)</span>
          <input
            value={clienteNombre}
            onChange={(e) => setClienteNombre(e.target.value)}
            className="input"
            placeholder="Nombre del cliente"
          />
        </label>

        {(items.length > 0 || servicios.length > 0) && montoTotalNum > 0 && (
          <div className="rounded-lg border border-white/10 bg-black/25 p-3">
            <div className="mb-2 flex items-center justify-between text-xs text-muted">
              <span className="font-semibold uppercase tracking-wide text-white/70">Vista previa del reparto</span>
              <span>Ganancia: ${preview.baseReparto.toLocaleString('es-CO')}</span>
            </div>
            <p className="mb-2 text-[11px] text-muted">Costo de productos: ${costoTotal.toLocaleString('es-CO')}</p>
            <div className="grid grid-cols-3 gap-2">
              <RepartoItem label="Mecánico" pct="50%" valor={preview.montoMecanico} color="bg-sky-500" />
              <RepartoItem label={nombreSocio1} pct="25%" valor={preview.montoDuena} color="bg-amber-500" />
              <RepartoItem label={nombreSocio2} pct="25%" valor={preview.montoSocio} color="bg-emerald-500" />
            </div>
          </div>
        )}

        {error && (
          <p className="flex items-center gap-2 rounded-lg bg-brand-700/15 px-3 py-2 text-sm text-brand-400 ring-1 ring-brand-700/30">
            <TriangleAlert size={16} className="shrink-0" />
            {error}
          </p>
        )}

        <button type="submit" disabled={enviando} className="btn-primary w-full">
          {enviando ? 'Confirmando…' : 'Confirmar venta'}
        </button>
      </form>
      </div>

      <div className="card sticky top-4 space-y-5 p-6 text-center">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Total a cobrar</p>
          <p className="font-display text-5xl leading-tight text-white">
            ${montoCobrado.toLocaleString('es-CO')}
          </p>
        </div>

        <label className="block">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted">Paga con</span>
          <MoneyInput value={pagaCon} onChange={setPagaCon} placeholder="0" className="text-center text-xl" />
        </label>

        {pagaConNum > 0 && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              {vuelto >= 0 ? 'Vuelto' : 'Falta'}
            </p>
            <p className={`font-display text-5xl leading-tight ${vuelto >= 0 ? 'text-emerald-400' : 'text-brand-500'}`}>
              ${Math.abs(vuelto).toLocaleString('es-CO')}
            </p>
          </div>
        )}
      </div>
      </div>

      <BarcodeScannerModal open={scannerOpen} onClose={() => setScannerOpen(false)} onDetected={handleEscaneado} />
    </div>
  )
}

function RepartoItem({ label, pct, valor, color }) {
  return (
    <div className="rounded-md bg-white/5 px-2 py-2 text-center">
      <span className={`mx-auto mb-1 block size-1.5 rounded-full ${color}`} />
      <p className="text-[10px] uppercase tracking-wide text-muted">
        {label} <span className="text-muted/70">{pct}</span>
      </p>
      <p className="text-sm font-semibold text-white">${valor.toLocaleString('es-CO')}</p>
    </div>
  )
}
