import { Link } from 'react-router-dom'
import { Package, ShoppingCart, History, BarChart3, CalendarCheck2, ArrowRight } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Dashboard() {
  const { usuario, isAdmin } = useAuth()

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md text-center">
        <p className="font-display text-2xl text-white">Hola, {usuario?.nombre_completo}</p>
        <p className="mt-1 text-sm text-muted">Consulta el inventario disponible.</p>
        <Link to="/inventario" className="btn-primary mt-6 inline-flex">
          <Package size={16} />
          Ver inventario
        </Link>
      </div>
    )
  }

  const accesos = [
    { to: '/ventas/nueva', label: 'Nueva venta', desc: 'Registrar una venta y ver el reparto', icon: ShoppingCart },
    { to: '/inventario', label: 'Inventario', desc: 'Productos y stock', icon: Package },
    { to: '/ventas/historial', label: 'Historial', desc: 'Ventas registradas', icon: History },
    { to: '/reportes', label: 'Reportes', desc: 'Más vendidos y stock bajo', icon: BarChart3 },
    { to: '/cierre', label: 'Cierre del día', desc: 'Generar imagen de cierre', icon: CalendarCheck2 },
  ]

  return (
    <div className="mx-auto max-w-4xl">
      <p className="font-display text-2xl text-white">Hola, {usuario?.nombre_completo}</p>
      <p className="mt-1 text-sm text-muted">¿Qué quieres hacer hoy?</p>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {accesos.map((a) => {
          const Icon = a.icon
          return (
            <Link
              key={a.to}
              to={a.to}
              className="card group flex items-start gap-4 p-5 transition hover:border-brand-600/60 hover:bg-surface-2"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-600/15 text-brand-500">
                <Icon size={20} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 text-sm font-semibold text-white">
                  {a.label}
                  <ArrowRight size={14} className="text-muted transition group-hover:translate-x-0.5 group-hover:text-brand-500" />
                </span>
                <span className="mt-1 block text-xs text-muted">{a.desc}</span>
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
