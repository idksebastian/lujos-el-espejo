import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { MessageCircle, Menu, X } from 'lucide-react'
import { WHATSAPP, WHATSAPP_HREF } from '../../lib/publicContent'

const NAV_LINKS = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/lunas', label: 'Lunas' },
  { to: '/servicios', label: 'Servicios' },
  { to: '/productos', label: 'Productos' },
  { to: '/contacto', label: 'Contacto' },
]

function NavItem({ to, label, end, onClick }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        `text-sm font-medium transition ${isActive ? 'text-white' : 'text-muted hover:text-white'}`
      }
    >
      {label}
    </NavLink>
  )
}

export default function PublicLayout() {
  const [menuAbierto, setMenuAbierto] = useState(false)

  return (
    <div className="min-h-screen bg-ink text-white">
      <header className="sticky top-0 z-30 border-b border-white/8 bg-ink/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo-icon.png" alt="Lujos El Espejo 2" className="size-9 rounded-lg" />
            <span className="font-display text-lg font-semibold leading-none tracking-wide">
              LUJOS EL ESPEJO <span className="text-brand-500">2</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-7 sm:flex">
            {NAV_LINKS.map((l) => (
              <NavItem key={l.to} {...l} />
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <a href={WHATSAPP_HREF} target="_blank" rel="noreferrer" className="btn-primary hidden sm:inline-flex">
              <MessageCircle size={16} />
              Escríbenos
            </a>
            <button
              type="button"
              onClick={() => setMenuAbierto((v) => !v)}
              aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
              className="flex size-9 items-center justify-center rounded-lg border border-white/10 text-white sm:hidden"
            >
              {menuAbierto ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {menuAbierto && (
          <nav className="flex flex-col gap-4 border-t border-white/8 px-5 py-5 sm:hidden">
            {NAV_LINKS.map((l) => (
              <NavItem key={l.to} {...l} onClick={() => setMenuAbierto(false)} />
            ))}
            <a href={WHATSAPP_HREF} target="_blank" rel="noreferrer" className="btn-primary mt-1 inline-flex">
              <MessageCircle size={16} />
              Escríbenos por WhatsApp
            </a>
          </nav>
        )}
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="border-t border-white/8">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-5 py-8 text-center sm:flex-row sm:justify-between sm:text-left">
          <p className="text-sm text-muted">© {new Date().getFullYear()} Lujos El Espejo 2</p>
          <div className="flex items-center gap-4 text-sm text-muted">
            <a href={`tel:+${WHATSAPP}`} className="hover:text-white">
              +57 320 264 2451
            </a>
            <a
              href="https://www.tiktok.com/@lujoselespejo"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white"
            >
              TikTok
            </a>
          </div>
        </div>
      </footer>

      <a
        href={WHATSAPP_HREF}
        target="_blank"
        rel="noreferrer"
        aria-label="Escríbenos por WhatsApp"
        className="fixed bottom-5 right-5 z-40 flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/40 transition hover:scale-105"
      >
        <MessageCircle size={26} fill="white" className="text-[#25D366]" />
      </a>
    </div>
  )
}
