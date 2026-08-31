import { MessageCircle, Phone, MapPin, Clock, Truck, ArrowUpRight } from 'lucide-react'

const WHATSAPP = '573202642451'
const WHATSAPP_HREF = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent('Hola, quiero información sobre sus productos')}`
const DIRECCION = 'Cra 12 #29-02, Barrio La Victoria, Pereira, Risaralda'
const MAPA_QUERY = encodeURIComponent(DIRECCION)

const SERVICIOS = [
  {
    nombre: 'Lunas para carro y moto',
    desc: 'Vidrios y espejos a la medida, instalación incluida — nuestra especialidad.',
  },
  { nombre: 'Plumillas', desc: 'Cambio de plumillas para todo tipo de vehículo.' },
  { nombre: 'Bombillería', desc: 'Bombillos y luces para carro y moto, en el momento.' },
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
        <div className="pointer-events-none absolute -top-32 left-1/2 h-72 w-xl -translate-x-1/2 rounded-full bg-brand-600/20 blur-3xl" />
        <div className="relative mx-auto max-w-3xl px-5 py-16 text-center sm:py-24">
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
            <a href={`tel:+${WHATSAPP}`} className="btn-secondary">
              <Phone size={16} />
              Llamar
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-14">
        <h2 className="font-display text-2xl text-white">Qué hacemos</h2>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICIOS.map((s) => (
            <div key={s.nombre} className="card p-5">
              <p className="text-base font-semibold text-white">{s.nombre}</p>
              <p className="mt-1.5 text-sm text-muted">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-14">
        <h2 className="font-display text-2xl text-white">Dónde estamos</h2>
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
    </div>
  )
}
