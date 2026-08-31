import { useEffect, useRef, useState } from 'react'
import { MessageCircle, MapPin, Clock, Truck, ArrowUpRight, Sparkles } from 'lucide-react'

const WHATSAPP = '573202642451'
const WHATSAPP_MENSAJE = 'Hola, quiero información sobre sus productos'
const WHATSAPP_HREF = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(WHATSAPP_MENSAJE)}`
const DIRECCION = 'Cra 12 #29-02, Barrio La Victoria, Pereira, Risaralda'
// La búsqueda del mapa va sin barrio/departamento a propósito: entre más
// texto se le pase al geocodificador de Google, más se confunde con
// direcciones colombianas de este formato (carrera/calle + número).
const MAPA_QUERY = encodeURIComponent('Cra 12 #29-02, Pereira, Colombia')

const SERVICIOS = [
  {
    nombre: 'Lunas para carro y moto',
    desc: 'Vidrios y espejos a la medida, instalación incluida — nuestra especialidad.',
    destacado: true,
  },
  { nombre: 'Plumillas', desc: 'Cambio de plumillas para todo tipo de vehículo.' },
  { nombre: 'Bombillería', desc: 'Bombillos y luces LED para carro y moto, en el momento.' },
  { nombre: 'Seguros', desc: 'Asesoría y trámite de seguros para tu vehículo.' },
  { nombre: 'Identicar', desc: 'Trámite de identificación vehicular.' },
]

const JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'AutomotiveBusiness',
  name: 'Lujos El Espejo',
  description:
    'Lunas para carro y moto, plumillas, bombillería, seguros e identicar, en el barrio La Victoria, Pereira.',
  image: 'https://lujoselespejo.com/logo.jpg',
  telephone: '+573202642451',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Cra 12 #29-02',
    addressLocality: 'Pereira',
    addressRegion: 'Risaralda',
    addressCountry: 'CO',
  },
  openingHoursSpecification: {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    opens: '08:00',
    closes: '17:00',
  },
  sameAs: ['https://www.tiktok.com/@lujoselespejo'],
  makesOffer: SERVICIOS.map((s) => ({
    '@type': 'Offer',
    itemOffered: { '@type': 'Service', name: s.nombre, description: s.desc },
  })),
}

// Revela cada sección con un fundido + desplazamiento suave al entrar en
// pantalla — le da vida a la página sin depender de una librería de
// animación. Respeta prefers-reduced-motion mostrando todo de una vez.
function Reveal({ children, className = '', delay = 0 }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true)
      return
    }
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          obs.disconnect()
        }
      },
      { threshold: 0.15 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      style={{ transitionDelay: visible ? `${delay}ms` : '0ms' }}
      className={`transition-all duration-700 ease-out ${visible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'} ${className}`}
    >
      {children}
    </div>
  )
}

function HeroMedia() {
  const [videoError, setVideoError] = useState(false)

  if (videoError) {
    return <div className="absolute inset-0 bg-linear-to-b from-brand-700/25 via-ink to-ink" />
  }

  return (
    <>
      {/* Se activa solo si existe /hero.mp4 — si no, cae al degradado de
          arriba sin romper nada. Para poner un video real: exporta un clip
          corto (10-20s) de trabajo real en el taller, sin audio importante
          (queda muteado), y guárdalo como public/hero.mp4. */}
      <video
        autoPlay
        muted
        loop
        playsInline
        poster="/logo.jpg"
        onError={() => setVideoError(true)}
        className="absolute inset-0 size-full object-cover opacity-40"
      >
        <source src="/hero.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-linear-to-b from-ink/60 via-ink/70 to-ink" />
    </>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-ink text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />

      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2.5">
          <img src="/logo.jpg" alt="Lujos El Espejo" className="size-9 rounded-lg" />
          <span className="font-display text-lg font-semibold leading-none tracking-wide">
            LUJOS <span className="text-brand-500">EL ESPEJO</span>
          </span>
        </div>
        <a href={WHATSAPP_HREF} target="_blank" rel="noreferrer" className="btn-primary hidden sm:inline-flex">
          <MessageCircle size={16} />
          Escríbenos
        </a>
      </header>

      <section className="relative overflow-hidden">
        <HeroMedia />
        <div className="relative mx-auto max-w-3xl px-5 py-20 text-center sm:py-28">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-brand-500">
            Barrio La Victoria · Pereira
          </p>
          <h1 className="font-display text-4xl leading-tight text-white sm:text-5xl" style={{ textWrap: 'balance' }}>
            Lujos y accesorios para tu carro
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-base text-muted">
            Especialistas en lunas para carro y moto — más plumillas, bombillería, seguros e identicar. Hacemos envíos
            nacionales y domicilios.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a href={WHATSAPP_HREF} target="_blank" rel="noreferrer" className="btn-primary">
              <MessageCircle size={16} />
              Escríbenos por WhatsApp
            </a>
          </div>

          <div className="mx-auto mt-14 flex max-w-md items-center justify-center gap-8 border-t border-white/8 pt-8">
            <div>
              <p className="font-display text-2xl text-white">414+</p>
              <p className="text-xs text-muted">Seguidores en TikTok</p>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div>
              <p className="font-display text-2xl text-white">1.6K</p>
              <p className="text-xs text-muted">Me gusta</p>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div>
              <p className="font-display text-2xl text-white">98K</p>
              <p className="text-xs text-muted">Vistas en un video</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-14 text-center">
        <Reveal>
          <span className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-brand-600/15 text-brand-500">
            <Sparkles size={18} />
          </span>
          <h2 className="font-display text-2xl text-white">Especialistas en lunas, de toda la vida</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted">
            Nos dedicamos a conseguir e instalar lunas para carro y moto que en otros lados es difícil encontrar —
            desde un espejo lateral hasta el vidrio completo. Si no la tenemos en el momento, te la conseguimos.
          </p>
        </Reveal>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-14">
        <Reveal>
          <h2 className="font-display text-2xl text-white">Qué hacemos</h2>
        </Reveal>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICIOS.map((s, i) => (
            <Reveal key={s.nombre} delay={i * 60}>
              <div
                className={`card h-full p-5 transition hover:-translate-y-0.5 hover:border-brand-600/50 ${s.destacado ? 'ring-1 ring-brand-600/40' : ''}`}
              >
                {s.destacado && (
                  <span className="mb-2 inline-block rounded-full bg-brand-600/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-500">
                    Especialidad
                  </span>
                )}
                <p className="text-base font-semibold text-white">{s.nombre}</p>
                <p className="mt-1.5 text-sm text-muted">{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-14">
        <Reveal>
          <h2 className="font-display text-2xl text-white">Dónde estamos</h2>
        </Reveal>
        <Reveal delay={100}>
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.2fr]">
            <div className="space-y-5">
              <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-600/15 text-brand-500">
                  <MapPin size={18} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">Dirección</p>
                  <p className="text-sm text-muted">{DIRECCION}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-600/15 text-brand-500">
                  <Clock size={18} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">Horario</p>
                  <p className="text-sm text-muted">Lunes a sábado, 8:00 a.m. – 5:00 p.m.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-600/15 text-brand-500">
                  <Truck size={18} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">Envíos</p>
                  <p className="text-sm text-muted">Domicilios en Pereira y envíos a toda Colombia.</p>
                </div>
              </div>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${MAPA_QUERY}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-500 hover:text-brand-400"
              >
                Cómo llegar
                <ArrowUpRight size={14} />
              </a>
            </div>
            <div className="overflow-hidden rounded-2xl border border-white/8">
              <iframe
                title="Ubicación de Lujos El Espejo"
                src={`https://maps.google.com/maps?q=${MAPA_QUERY}&output=embed`}
                className="h-72 w-full lg:h-full"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-14 text-center">
        <Reveal>
          <h2 className="font-display text-2xl text-white" style={{ textWrap: 'balance' }}>
            ¿Necesitas una luna, un repuesto o un consejo?
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Escríbenos por WhatsApp y te respondemos rápido — decinos la marca, línea y año de tu vehículo.
          </p>
          <a href={WHATSAPP_HREF} target="_blank" rel="noreferrer" className="btn-primary mt-6 inline-flex">
            <MessageCircle size={16} />
            Escríbenos por WhatsApp
          </a>
        </Reveal>
      </section>

      <footer className="border-t border-white/8">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-5 py-8 text-center sm:flex-row sm:justify-between sm:text-left">
          <p className="text-sm text-muted">© {new Date().getFullYear()} Lujos El Espejo</p>
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
