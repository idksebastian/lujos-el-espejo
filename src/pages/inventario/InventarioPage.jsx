import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, Pencil, Power, TriangleAlert, Search, PackagePlus, Camera, Trash2 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import ProductoFormModal from '../../components/ProductoFormModal'
import AjustarStockModal from '../../components/AjustarStockModal'
import BarcodeScannerModal from '../../components/BarcodeScannerModal'

export default function InventarioPage() {
  const { isAdmin } = useAuth()
  const [productos, setProductos] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState({ open: false, producto: null })
  const [modalStock, setModalStock] = useState({ open: false, producto: null })
  const [scannerOpen, setScannerOpen] = useState(false)
  const [avisoScan, setAvisoScan] = useState('')

  const cargar = useCallback(async () => {
    setCargando(true)
    setError('')

    const tabla = isAdmin ? 'productos' : 'inventario_publico'
    let query = supabase.from(tabla).select('*').order('nombre', { ascending: true })

    if (!isAdmin) query = query.eq('activo', true)

    const { data, error } = await query
    if (error) {
      setError(error.message)
    } else {
      setProductos(data ?? [])
    }
    setCargando(false)
  }, [isAdmin])

  useEffect(() => {
    cargar()
  }, [cargar])

  const filtrados = useMemo(() => {
    const term = busqueda.trim().toLowerCase()
    if (!term) return productos
    return productos.filter((p) => p.nombre.toLowerCase().includes(term))
  }, [productos, busqueda])

  // Plata que hay metida en el inventario: costo de compra × stock que
  // queda de cada producto, sumado. Solo el admin ve costos, así que este
  // total también es solo para admin (igual que ya pasaba con "Costo" en
  // cada fila).
  const totalInvertido = useMemo(
    () => productos.reduce((sum, p) => sum + Number(p.costo ?? 0) * (p.stock_actual ?? 0), 0),
    [productos]
  )

  function handleEscaneado(codigo) {
    setScannerOpen(false)
    setAvisoScan('')
    const producto = productos.find((p) => p.codigo_barras === codigo)
    if (!producto) {
      setAvisoScan('No se encontró ningún producto con ese código.')
      return
    }
    setModalStock({ open: true, producto })
  }

  async function toggleActivo(producto) {
    const { error } = await supabase.from('productos').update({ activo: !producto.activo }).eq('id', producto.id)
    if (error) {
      setError(error.message)
      return
    }
    cargar()
  }

  async function handleEliminar(producto) {
    if (!window.confirm(`¿Eliminar "${producto.nombre}" por completo? Esto no se puede deshacer.`)) return

    setError('')
    const { error } = await supabase.from('productos').delete().eq('id', producto.id)
    if (error) {
      setError(
        error.code === '23503'
          ? `No se puede eliminar "${producto.nombre}": ya tiene ventas registradas. Desactívalo en su lugar.`
          : error.message
      )
      return
    }
    cargar()
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="font-display text-2xl text-white">Inventario</h1>
          {!cargando && (
            <p className="text-xs text-muted">
              {productos.length} producto{productos.length !== 1 && 's'} registrado{productos.length !== 1 && 's'}
              {isAdmin && ` · $${totalInvertido.toLocaleString('es-CO')} invertidos`}
            </p>
          )}
        </div>
        {isAdmin && (
          <button onClick={() => setModal({ open: true, producto: null })} className="btn-primary">
            <Plus size={16} />
            Nuevo producto
          </button>
        )}
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre…"
            className="input pl-9"
          />
        </div>
        {isAdmin && (
          <button type="button" onClick={() => setScannerOpen(true)} className="btn-secondary shrink-0">
            <Camera size={16} />
            Escanear
          </button>
        )}
      </div>

      {avisoScan && (
        <p className="flex items-center gap-2 rounded-lg bg-amber-950/50 px-3 py-2 text-sm text-amber-400 ring-1 ring-amber-900">
          <TriangleAlert size={16} className="shrink-0" />
          {avisoScan}
        </p>
      )}

      {error && (
        <p className="flex items-center gap-2 rounded-lg bg-brand-700/15 px-3 py-2 text-sm text-brand-400 ring-1 ring-brand-700/30">
          <TriangleAlert size={16} className="shrink-0" />
          {error}
        </p>
      )}

      {cargando ? (
        <p className="text-sm text-muted">Cargando…</p>
      ) : filtrados.length === 0 ? (
        <p className="text-sm text-muted">No hay productos que coincidan.</p>
      ) : (
        <ul className="card divide-y divide-white/8 overflow-hidden">
          {filtrados.map((p) => {
            const bajoStock = p.stock_actual <= p.stock_minimo
            return (
              <li key={p.id} className={`flex items-center justify-between gap-3 px-4 py-3 ${!p.activo ? 'opacity-50' : ''}`}>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{p.nombre}</p>
                  <p className="text-xs text-muted">
                    Stock: <span className={bajoStock ? 'font-semibold text-amber-400' : ''}>{p.stock_actual}</span>
                    {isAdmin && p.codigo_barras && <span className="ml-2">{p.codigo_barras}</span>}
                  </p>
                  {isAdmin && (
                    <p className="text-xs text-muted">
                      Costo: ${Number(p.costo).toLocaleString('es-CO')}
                      {p.precio_sugerido != null && ` · Sugerido: $${Number(p.precio_sugerido).toLocaleString('es-CO')}`}
                    </p>
                  )}
                </div>
                {bajoStock && (
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-amber-950 px-2 py-1 text-[10px] font-medium text-amber-400 ring-1 ring-amber-900">
                    <TriangleAlert size={11} />
                    Bajo
                  </span>
                )}
                {isAdmin && (
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => setModalStock({ open: true, producto: p })}
                      className="rounded-lg border border-white/10 p-2 text-white/70 hover:bg-white/8 hover:text-white"
                      aria-label="Ajustar stock"
                    >
                      <PackagePlus size={14} />
                    </button>
                    <button
                      onClick={() => setModal({ open: true, producto: p })}
                      className="rounded-lg border border-white/10 p-2 text-white/70 hover:bg-white/8 hover:text-white"
                      aria-label="Editar"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => toggleActivo(p)}
                      className="rounded-lg border border-white/10 p-2 text-white/70 hover:bg-white/8 hover:text-white"
                      aria-label={p.activo ? 'Desactivar' : 'Activar'}
                    >
                      <Power size={14} />
                    </button>
                    <button
                      onClick={() => handleEliminar(p)}
                      className="rounded-lg border border-white/10 p-2 text-white/70 hover:bg-brand-700/15 hover:text-brand-400"
                      aria-label="Eliminar"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {isAdmin && (
        <ProductoFormModal
          open={modal.open}
          producto={modal.producto}
          onClose={() => setModal({ open: false, producto: null })}
          onSaved={() => {
            setModal({ open: false, producto: null })
            cargar()
          }}
        />
      )}

      {isAdmin && (
        <AjustarStockModal
          open={modalStock.open}
          producto={modalStock.producto}
          onClose={() => setModalStock({ open: false, producto: null })}
          onAjustado={() => {
            setModalStock({ open: false, producto: null })
            cargar()
          }}
        />
      )}

      {isAdmin && (
        <BarcodeScannerModal open={scannerOpen} onClose={() => setScannerOpen(false)} onDetected={handleEscaneado} />
      )}
    </div>
  )
}
