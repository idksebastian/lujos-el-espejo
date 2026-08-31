import { useEffect, useState } from 'react'
import { X, Camera, Hash } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import BarcodeScannerModal from './BarcodeScannerModal'
import MoneyInput from './MoneyInput'

const VACIO = {
  nombre: '',
  costo: '',
  precio_sugerido: '',
  stock_actual: '0',
  stock_minimo: '0',
  codigo_barras: '',
  origen_codigo: null,
}

export default function ProductoFormModal({ open, producto, onClose, onSaved }) {
  const [form, setForm] = useState(VACIO)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    if (!open) return
    if (producto) {
      setForm({
        nombre: producto.nombre ?? '',
        costo: String(producto.costo ?? ''),
        precio_sugerido: producto.precio_sugerido != null ? String(producto.precio_sugerido) : '',
        stock_actual: String(producto.stock_actual ?? 0),
        stock_minimo: String(producto.stock_minimo ?? 0),
        codigo_barras: producto.codigo_barras ?? '',
        origen_codigo: producto.origen_codigo ?? null,
      })
    } else {
      setForm(VACIO)
    }
    setError('')
  }, [open, producto])

  if (!open) return null

  function setField(name, value) {
    setForm((f) => ({ ...f, [name]: value }))
  }

  async function handleGenerarCodigo() {
    setError('')
    const { data, error } = await supabase.rpc('generar_codigo_interno')
    if (error) {
      setError('No se pudo generar el código interno: ' + error.message)
      return
    }
    setForm((f) => ({ ...f, codigo_barras: data, origen_codigo: 'generado' }))
  }

  function handleEscaneado(codigo) {
    setScannerOpen(false)
    setField('codigo_barras', codigo)
    setField('origen_codigo', 'fabrica')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const nombre = form.nombre.trim()
    const costo = Number(form.costo)
    const precioSugerido = form.precio_sugerido.trim() === '' ? null : Number(form.precio_sugerido)
    const stockActual = Number(form.stock_actual)
    const stockMinimo = Number(form.stock_minimo)

    if (!nombre) return setError('El nombre es obligatorio')
    if (!Number.isFinite(costo) || costo < 0) return setError('El costo debe ser un número mayor o igual a 0')
    if (precioSugerido !== null && (!Number.isFinite(precioSugerido) || precioSugerido < 0)) {
      return setError('El precio sugerido debe ser un número válido')
    }
    if (!Number.isInteger(stockActual) || stockActual < 0) return setError('El stock inicial debe ser un entero ≥ 0')
    if (!Number.isInteger(stockMinimo) || stockMinimo < 0) return setError('El stock mínimo debe ser un entero ≥ 0')

    const payload = {
      nombre,
      costo,
      precio_sugerido: precioSugerido,
      stock_minimo: stockMinimo,
      codigo_barras: form.codigo_barras.trim() || null,
      origen_codigo: form.codigo_barras.trim() ? form.origen_codigo : null,
    }

    setGuardando(true)
    try {
      if (producto) {
        const { error } = await supabase.from('productos').update(payload).eq('id', producto.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('productos').insert({ ...payload, stock_actual: stockActual })
        if (error) throw error
      }
      onSaved()
    } catch (err) {
      setError(
        err.message?.includes('duplicate') || err.code === '23505'
          ? 'Ese código de barras ya está en uso por otro producto'
          : err.message
      )
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/70 sm:items-center sm:p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-white/8 bg-surface p-5 sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg text-white">{producto ? 'Editar producto' : 'Nuevo producto'}</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-muted hover:bg-white/8 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Campo label="Nombre">
            <input
              value={form.nombre}
              onChange={(e) => setField('nombre', e.target.value)}
              className="input"
              placeholder="Ej. Espejo lateral universal"
            />
          </Campo>

          <div className="grid grid-cols-2 gap-3">
            <Campo label="Costo">
              <MoneyInput value={form.costo} onChange={(v) => setField('costo', v)} />
            </Campo>
            <Campo label="Precio sugerido (opcional)">
              <MoneyInput value={form.precio_sugerido} onChange={(v) => setField('precio_sugerido', v)} />
            </Campo>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Campo label="Stock inicial" disabled={!!producto}>
              <input
                type="number"
                min="0"
                step="1"
                disabled={!!producto}
                value={form.stock_actual}
                onChange={(e) => setField('stock_actual', e.target.value)}
                onWheel={(e) => e.currentTarget.blur()}
                className="input disabled:opacity-50"
              />
            </Campo>
            <Campo label="Stock mínimo">
              <input
                type="number"
                min="0"
                step="1"
                value={form.stock_minimo}
                onChange={(e) => setField('stock_minimo', e.target.value)}
                onWheel={(e) => e.currentTarget.blur()}
                className="input"
              />
            </Campo>
          </div>
          {producto && (
            <p className="-mt-2 text-xs text-muted">
              El stock actual se ajusta con ventas o correcciones de inventario, no desde este formulario.
            </p>
          )}

          <Campo label="Código de barras">
            <div className="flex gap-2">
              <input
                value={form.codigo_barras}
                onChange={(e) => {
                  const valor = e.target.value
                  setForm((f) => ({
                    ...f,
                    codigo_barras: valor,
                    origen_codigo: valor.trim() ? f.origen_codigo ?? 'fabrica' : null,
                  }))
                }}
                placeholder="Sin código"
                className="input flex-1"
              />
            </div>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setScannerOpen(true)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs text-white/70 hover:bg-white/8 hover:text-white"
              >
                <Camera size={14} />
                Escanear código
              </button>
              <button
                type="button"
                onClick={handleGenerarCodigo}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs text-white/70 hover:bg-white/8 hover:text-white"
              >
                <Hash size={14} />
                Generar código interno
              </button>
            </div>
            {form.origen_codigo === 'generado' && form.codigo_barras && (
              <p className="mt-1 text-xs text-amber-400">
                Código interno — este producto no tiene etiqueta física, se buscará por nombre en la venta.
              </p>
            )}
          </Campo>

          {error && (
            <p className="rounded-lg bg-brand-700/15 px-3 py-2 text-sm text-brand-400 ring-1 ring-brand-700/30">{error}</p>
          )}

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancelar
            </button>
            <button type="submit" disabled={guardando} className="btn-primary flex-1">
              {guardando ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>

      <BarcodeScannerModal open={scannerOpen} onClose={() => setScannerOpen(false)} onDetected={handleEscaneado} />
    </div>
  )
}

function Campo({ label, children, disabled }) {
  return (
    <label className="block">
      <span className={`mb-1 block text-xs font-medium uppercase tracking-wide ${disabled ? 'text-white/25' : 'text-muted'}`}>
        {label}
      </span>
      {children}
    </label>
  )
}
