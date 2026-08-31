import { useEffect, useState } from 'react'
import { X, TriangleAlert, Plus, Minus } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

export default function AjustarStockModal({ open, producto, onClose, onAjustado }) {
  const [signo, setSigno] = useState(1)
  const [cantidad, setCantidad] = useState('')
  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    if (open) {
      setSigno(1)
      setCantidad('')
      setMotivo('')
      setError('')
    }
  }, [open])

  if (!open || !producto) return null

  async function handleSubmit(e) {
    e.preventDefault()
    const n = Number(cantidad)
    if (!Number.isInteger(n) || n <= 0) return setError('La cantidad debe ser un entero mayor a 0.')

    setError('')
    setGuardando(true)
    const { error } = await supabase.rpc('ajustar_stock', {
      p_producto_id: producto.id,
      p_delta: n * signo,
      p_motivo: motivo,
    })
    setGuardando(false)

    if (error) {
      setError(error.message)
      return
    }
    onAjustado()
  }

  const resultado = producto.stock_actual + (Number(cantidad) || 0) * signo

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/8 bg-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-base text-white">Ajustar stock</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-muted hover:bg-white/8 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <p className="mb-3 text-sm text-white/80">
          {producto.nombre} — stock actual: <span className="font-semibold">{producto.stock_actual}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSigno(1)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium ${
                signo === 1 ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400' : 'border-white/10 text-white/60'
              }`}
            >
              <Plus size={15} />
              Sumar
            </button>
            <button
              type="button"
              onClick={() => setSigno(-1)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium ${
                signo === -1 ? 'border-brand-600 bg-brand-600/15 text-brand-400' : 'border-white/10 text-white/60'
              }`}
            >
              <Minus size={15} />
              Restar
            </button>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs uppercase tracking-wide text-muted">Cantidad</span>
            <input
              type="number"
              min="1"
              step="1"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              onWheel={(e) => e.currentTarget.blur()}
              className="input"
              autoFocus
            />
          </label>

          {cantidad && (
            <p className="text-xs text-muted">
              Nuevo stock: <span className="font-medium text-white">{resultado}</span>
            </p>
          )}

          <label className="block">
            <span className="mb-1 block text-xs uppercase tracking-wide text-muted">Motivo (opcional)</span>
            <input
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder={signo === 1 ? 'Ej. Compra a proveedor' : 'Ej. Producto dañado/perdido'}
              className="input"
            />
          </label>

          {error && (
            <p className="flex items-center gap-2 rounded-lg bg-brand-700/15 px-3 py-2 text-sm text-brand-400 ring-1 ring-brand-700/30">
              <TriangleAlert size={16} className="shrink-0" />
              {error}
            </p>
          )}

          <button type="submit" disabled={guardando} className="btn-primary w-full">
            {guardando ? 'Guardando…' : 'Confirmar ajuste'}
          </button>
        </form>
      </div>
    </div>
  )
}
