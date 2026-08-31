import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  History,
  BarChart3,
  CalendarCheck2,
  Wallet,
  Wrench,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabaseClient'

const ADMIN_LINKS = [
  { to: '/admin', label: 'Inicio', end: true, icon: LayoutDashboard },
  { to: '/admin/inventario', label: 'Inventario', icon: Package },
  { to: '/admin/ventas/nueva', label: 'Nueva venta', icon: ShoppingCart },
  { to: '/admin/ventas/historial', label: 'Historial', icon: History },
  { to: '/admin/reportes', label: 'Reportes', icon: BarChart3 },
  { to: '/admin/cierre', label: 'Cierre del día', icon: CalendarCheck2 },
  { to: '/admin/gastos', label: 'Gastos', icon: Wallet },
  { to: '/admin/mecanicos', label: 'Mecánicos', icon: Wrench },
  { to: '/admin/usuarios', label: 'Usuarios', icon: Users },
  { to: '/admin/configuracion', label: 'Configuración', icon: Settings },
]

const MECANICO_LINKS = [{ to: '/admin/inventario', label: 'Inventario', end: true, icon: Package }]

export default function Layout() {
  const { usuario, logout } = useAuth()
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [stockBajoCount, setStockBajoCount] = useState(0)
  const links = usuario?.rol === 'admin' ? ADMIN_LINKS : MECANICO_LINKS

  useEffect(() => {
    if (usuario?.rol !== 'admin') return
    supabase
      .from('productos')
      .select('stock_actual, stock_minimo')
      .eq('activo', true)
      .then(({ data }) => {
        const bajos = (data ?? []).filter((p) => p.stock_actual <= p.stock_minimo).length
        setStockBajoCount(bajos)
      })
  }, [usuario?.rol, location.pathname])

  return (
    <div className="flex h-screen overflow-hidden bg-ink text-white">
      <SidebarContent
        links={links}
        usuario={usuario}
        onLogout={logout}
        stockBajoCount={stockBajoCount}
        className="hidden md:flex"
      />

      {drawerOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setDrawerOpen(false)} />
          <SidebarContent
            links={links}
            usuario={usuario}
            onLogout={logout}
            stockBajoCount={stockBajoCount}
            onNavigate={() => setDrawerOpen(false)}
            className="relative z-10 flex animate-[slide-in_0.15s_ease-out]"
            onClose={() => setDrawerOpen(false)}
          />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex shrink-0 items-center justify-between border-b border-white/8 bg-ink/95 px-4 py-3 backdrop-blur md:hidden">
          <button
            onClick={() => setDrawerOpen(true)}
            className="rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white"
            aria-label="Abrir menú"
          >
            <Menu size={22} />
          </button>
          <span className="font-display text-lg font-semibold tracking-wide">
            LUJOS <span className="text-brand-500">EL ESPEJO</span>
          </span>
          <div className="w-9" />
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function SidebarContent({ links, usuario, onLogout, stockBajoCount = 0, onNavigate, className = '', onClose }) {
  return (
    <aside className={`w-64 shrink-0 flex-col border-r border-white/8 bg-surface ${className}`}>
      <div className="flex items-center justify-between px-5 py-5">
        <span className="font-display text-xl font-semibold leading-none tracking-wide">
          LUJOS
          <br />
          <span className="text-brand-500">EL ESPEJO</span>
        </span>
        {onClose && (
          <button onClick={onClose} className="rounded-lg p-1.5 text-white/60 hover:bg-white/10" aria-label="Cerrar menú">
            <X size={20} />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        {links.map((link) => {
          const Icon = link.icon
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive ? 'bg-brand-600 text-white' : 'text-white/60 hover:bg-white/8 hover:text-white'
                }`
              }
            >
              <Icon size={18} strokeWidth={2} />
              {link.label}
              {link.to === '/admin/reportes' && stockBajoCount > 0 && (
                <span className="ml-auto flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white">
                  {stockBajoCount}
                </span>
              )}
            </NavLink>
          )
        })}
      </nav>

      <div className="border-t border-white/8 px-4 py-4">
        <p className="truncate text-sm font-medium text-white">{usuario?.nombre_completo}</p>
        <p className="truncate text-xs text-muted">@{usuario?.nombre_usuario}</p>
        <button
          onClick={onLogout}
          className="mt-3 flex w-full items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-white/70 hover:bg-white/8 hover:text-white"
        >
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
