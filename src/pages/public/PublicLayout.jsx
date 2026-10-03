import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import WhatsAppIcon from '../../components/public/WhatsAppIcon'
import { WHATSAPP, whatsappHref, mensajeParaRuta, NOMBRE_NEGOCIO } from '../../lib/publicContent'
import { iniciarAnalytics, registrarVista, registrarClicsDeConversion } from '../../lib/analytics'

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
  const location = useLocation()
  const whatsappActual = whatsappHref(mensajeParaRuta(location.pathname))

  // React Router no resetea el scroll al navegar (a diferencia de una
  // recarga normal de página) — sin esto, entrar a una página nueva
  // hereda el scroll que traías en la anterior.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  // Analytics solo en el sitio público. Si no hay VITE_GA_MEASUREMENT_ID,
  // estas funciones no hacen nada.
  useEffect(() => {
    iniciarAnalytics()
    return registrarClicsDeConversion()
  }, [])

  useEffect(() => {
    registrarVista(location.pathname)
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-ink text-white">
      <header className="sticky top-0 z-30 border-b border-white/8 bg-ink/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo-icon.png" alt={NOMBRE_NEGOCIO} className="size-9 rounded-lg" />
            <span className="font-display text-lg font-semibold leading-none tracking-wide">
              LUJOS EL ESPEJO
            </span>
          </Link>

          <nav className="hidden items-center gap-7 sm:flex">
            {NAV_LINKS.map((l) => (
              <NavItem key={l.to} {...l} />
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <a
              href={whatsappActual}
              target="_blank"
              rel="noreferrer"
              data-cta="header"
              className="btn-primary hidden sm:inline-flex"
            >
              <WhatsAppIcon size={16} />
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
            <a
              href={whatsappActual}
              target="_blank"
              rel="noreferrer"
              data-cta="menu"
              className="btn-primary mt-1 inline-flex"
            >
              <WhatsAppIcon size={16} />
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
          <p className="text-sm text-muted">© {new Date().getFullYear()} {NOMBRE_NEGOCIO}</p>
          <div className="flex items-center gap-4 text-sm text-muted">
            <a href={`tel:+${WHATSAPP}`} data-cta="footer" className="hover:text-white">
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

      <div className="fixed bottom-5 right-5 z-40 flex items-center gap-3">
        <span className="max-w-44 rounded-xl border border-white/10 bg-surface px-3 py-2 text-xs font-medium leading-snug text-white shadow-lg shadow-black/40">
          ¿Necesitas ayuda con tu vehículo?
        </span>
        <a
          href={whatsappActual}
          target="_blank"
          rel="noreferrer"
          data-cta="flotante"
          aria-label="Escríbenos por WhatsApp"
          title="Escríbenos por WhatsApp"
          className="flex size-14 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/40 transition hover:scale-105"
        >
          <WhatsAppIcon size={30} />
        </a>
      </div>
    </div>
  )
}
