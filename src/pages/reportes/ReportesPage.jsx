import { useEffect, useState } from 'react'
import { TriangleAlert, TrendingUp } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'

export default function ReportesPage() {
  const [masVendidos, setMasVendidos] = useState([])
  const [stockBajo, setStockBajo] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    async function cargar() {
      setCargando(true)
      const [vendidos, bajo] = await Promise.all([
        supabase
          .from('reporte_productos_mas_vendidos')
          .select('*')
          .gt('unidades_vendidas', 0)
          .limit(15),
        supabase
          .from('productos')
          .select('id, nombre, stock_actual, stock_minimo')
          .eq('activo', true)
          .order('stock_actual', { ascending: true }),
      ])
      setMasVendidos(vendidos.data ?? [])
      setStockBajo((bajo.data ?? []).filter((p) => p.stock_actual <= p.stock_minimo))
      setCargando(false)
    }
    cargar()
  }, [])

  if (cargando) return <p className="text-sm text-muted">Cargando…</p>

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-display text-2xl text-white">Reportes</h1>

      <section className="card p-4">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white/80">
          <TriangleAlert size={16} className="text-amber-400" />
          Alertas de stock bajo
        </h2>
        {stockBajo.length === 0 ? (
          <p className="text-sm text-muted">Todo el inventario está por encima del mínimo.</p>
        ) : (
          <ul className="space-y-2">
            {stockBajo.map((p) => (
              <li key={p.id} className="flex items-center justify-between text-sm">
                <span className="text-white">{p.nombre}</span>
                <span className="text-amber-400">
                  {p.stock_actual} / mín. {p.stock_minimo}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card p-4">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white/80">
          <TrendingUp size={16} className="text-brand-500" />
          Productos más vendidos
        </h2>
        {masVendidos.length === 0 ? (
          <p className="text-sm text-muted">Aún no hay ventas registradas.</p>
        ) : (
          <ol className="space-y-2">
            {masVendidos.map((p, i) => (
              <li key={p.producto_id} className="flex items-center justify-between text-sm">
                <span className="text-white">
                  {i + 1}. {p.nombre}
                </span>
                <span className="text-muted">{p.unidades_vendidas} unidades</span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  )
}
