// Google Analytics 4 sin librerías extra. El Measurement ID de producción va
// por defecto aquí; VITE_GA_MEASUREMENT_ID, si existe, lo sobrescribe (por
// ejemplo para probar con otra propiedad). Un Measurement ID es público, no
// es una credencial.
//
// Solo se llama desde las páginas públicas (PublicLayout), así que el panel
// de administración nunca envía eventos.

const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-HCFM85M6NJ'

// Solo se envían datos desde el dominio de producción. localhost, previews
// de Vercel y cualquier otro host no inicializan GA4, así que las funciones
// de abajo quedan en no-op.
const HOSTS_PRODUCCION = ['lujoselespejo.com', 'www.lujoselespejo.com']

let iniciado = false

export function iniciarAnalytics() {
  if (!GA_ID || iniciado) return
  if (!HOSTS_PRODUCCION.includes(window.location.hostname)) return
  iniciado = true

  // gtag se define antes de cargar el script: si un bloqueador lo impide,
  // las llamadas siguen siendo seguras (quedan en dataLayer sin enviarse).
  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag() {
    window.dataLayer.push(arguments)
  }
  window.gtag('js', new Date())
  // send_page_view: false porque es una SPA; las vistas se mandan a mano en
  // registrarVista() cada vez que cambia la ruta.
  window.gtag('config', GA_ID, { send_page_view: false })

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
  document.head.appendChild(script)
}

export function registrarVista(pathname) {
  if (!iniciado) return
  window.gtag('event', 'page_view', { page_path: pathname })
}

export function trackEvent(nombre, parametros = {}) {
  if (!iniciado) return
  // Quita los valores vacíos para no mandar campos sin contenido.
  const limpios = Object.fromEntries(Object.entries(parametros).filter(([, v]) => v !== undefined && v !== ''))
  window.gtag('event', nombre, limpios)
}

// Clics en WhatsApp, teléfono y Google Maps. Se escuchan en captura sobre el
// documento para no tocar cada enlace: el enlace sigue abriendo exactamente
// igual. Solo se envían el tipo de evento, la ruta y el lugar del botón; no
// se envía el texto del mensaje de WhatsApp ni ningún dato del visitante.
export function registrarClicsDeConversion() {
  function onClick(e) {
    const enlace = e.target?.closest?.('a[href]')
    if (!enlace) return

    const href = enlace.getAttribute('href')
    let evento = null
    if (href.startsWith('https://wa.me/')) evento = 'whatsapp_click'
    else if (href.startsWith('tel:')) evento = 'phone_click'
    else if (href.includes('google.com/maps')) evento = 'maps_click'
    if (!evento) return

    const pathname = window.location.pathname
    const servicio = pathname.match(/^\/servicios\/([^/]+)/)?.[1] ?? (pathname === '/lunas' ? 'lunas' : undefined)

    trackEvent(evento, {
      page: pathname,
      service: servicio,
      location: enlace.dataset.cta || 'contenido',
    })
  }

  document.addEventListener('click', onClick, true)
  return () => document.removeEventListener('click', onClick, true)
}
