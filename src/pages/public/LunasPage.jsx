import { Link } from 'react-router-dom'
import { Car, Search, PackageCheck, ArrowUpRight } from 'lucide-react'
import WhatsAppIcon from '../../components/public/WhatsAppIcon'
import Reveal from '../../components/public/Reveal'
import FotoPublica from '../../components/public/FotoPublica'
import JsonLd from '../../components/public/JsonLd'
import {
  CATEGORIAS,
  buildBreadcrumbJsonLd,
  buildServicioJsonLd,
  whatsappHref,
  mensajeParaRuta,
} from '../../lib/publicContent'
import { useSitioFotos } from '../../lib/sitioFotos'
import { useSeo } from '../../lib/useSeo'

const WHATSAPP_LUNAS = whatsappHref(mensajeParaRuta('/lunas'))

const PASOS = [
  {
    icon: Car,
    titulo: 'Cuéntanos tu vehículo',
    desc: 'Marca, línea, año y qué luna necesitas (parabrisas, panorámica, espejo, ventana).',
  },
  {
    icon: Search,
    titulo: 'La buscamos',
    desc: 'Si no la tenemos en el momento en el local, te la conseguimos.',
  },
  {
    icon: PackageCheck,
    titulo: 'Instalación incluida',
    desc: 'La instalamos en el mismo local, en el barrio La Victoria, Pereira.',
  },
]

const BUSQUEDA = [
  'Marca del vehículo',
  'Línea o modelo',
  'Año',
  'Lado del vehículo (izquierdo o derecho)',
  'Tipo de espejo o luna: solo el vidrio, espejo completo, o si tiene control eléctrico o calefacción',
]

const CUANDO = [
  'Se rompió o se rajó por un golpe o un impacto.',
  'Quedó rota después de un robo o un intento de robo.',
  'El reflejo se ve manchado, opaco o se despegó del soporte.',
]

const FAQ = [
  {
    p: '¿Venden lunas de espejo para carros?',
    r: 'Sí. Manejamos lunas y espejos para carro y moto, y si no tenemos la referencia en el momento, te la conseguimos.',
  },
  {
    p: '¿Pueden conseguir una luna que no tengan disponible?',
    r: 'Sí. Envíanos la marca, la línea y el año, y te confirmamos si la podemos conseguir.',
  },
  {
    p: '¿Instalan la luna o el espejo?',
    r: 'Sí, la instalación está incluida y se hace en nuestro local del barrio La Victoria, en Pereira.',
  },
  {
    p: '¿Cómo sé qué luna necesita mi carro?',
    r: 'Con la marca, la línea y el año basta para empezar. Si tienes la luna rota o el espejo a la mano, una foto nos ayuda a identificarla.',
  },
  {
    p: '¿Atienden vehículos de diferentes marcas?',
    r: 'Sí. Atendemos carros de distintas marcas. Dinos cuál es el tuyo y te confirmamos disponibilidad.',
  },
  {
    p: '¿Puedo cotizar enviando una foto por WhatsApp?',
    r: 'Sí. Envíanos una foto de la luna o del vehículo, junto con la marca, la línea y el año.',
  },
]

const OTROS_SERVICIOS = CATEGORIAS.filter((c) => c.grupo === 'servicios')

export default function LunasPage() {
  const { fotos, alts } = useSitioFotos()
  const lunas = CATEGORIAS.find((c) => c.id === 'lunas')

  useSeo({
    title: 'Lunas para carros en Pereira | Lujos El Espejo',
    description:
      'Lunas y espejos para carros en Pereira. Conseguimos referencias difíciles de encontrar y realizamos la instalación. Cotiza por WhatsApp.',
    path: '/lunas',
  })

  return (
    <div>
      <JsonLd data={buildBreadcrumbJsonLd([{ nombre: 'Inicio', path: '/' }, { nombre: 'Lunas', path: '/lunas' }])} />
      <JsonLd data={buildServicioJsonLd(lunas)} />

      <section className="mx-auto max-w-3xl px-5 py-16 text-center sm:py-20">
        <Reveal>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-brand-500">Nuestra especialidad</p>
          <h1 className="font-display text-4xl leading-tight text-white sm:text-5xl" style={{ textWrap: 'balance' }}>
            Lunas y espejos para carros en Pereira
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-base text-muted">
            Vidrios y espejos para carro y moto, incluso las referencias más difíciles de encontrar. Si no la tenemos
            ahí mismo, te la conseguimos.
          </p>
          <a
            href={WHATSAPP_LUNAS}
            target="_blank"
            rel="noreferrer"
            data-cta="hero"
            className="btn-primary mt-8 inline-flex"
          >
            <WhatsAppIcon size={16} />
            Cotizar mi luna por WhatsApp
          </a>
        </Reveal>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-14">
        <Reveal>
          <h2 className="font-display text-2xl text-white">Cómo cotizamos tu luna</h2>
        </Reveal>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {PASOS.map((p, i) => (
            <Reveal key={p.titulo} delay={i * 80}>
              <div className="card h-full p-5">
                <span className="flex size-9 items-center justify-center rounded-lg bg-brand-600/15 text-brand-500">
                  <p.icon size={18} />
                </span>
                <p className="mt-3 text-base font-semibold text-white">{p.titulo}</p>
                <p className="mt-1.5 text-sm text-muted">{p.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={200}>
          <p className="mt-6 text-sm text-muted">
            Para una cotización rápida, envíanos por WhatsApp una foto de la luna o del vehículo, junto con la marca,
            línea y año.
          </p>
        </Reveal>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-14">
        <Reveal>
          <h2 className="font-display text-2xl text-white">¿Qué es una luna de espejo?</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            La luna de espejo es el vidrio reflectivo que va dentro de la carcasa del espejo lateral del carro. Si solo
            se daña el vidrio, no hace falta cambiar el espejo completo: basta con reemplazar la luna.
          </p>
        </Reveal>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-14">
        <Reveal>
          <h2 className="font-display text-2xl text-white">¿Cuándo se necesita cambiarla?</h2>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted">
            {CUANDO.map((c) => (
              <li key={c} className="flex gap-2">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-500" />
                {c}
              </li>
            ))}
          </ul>
        </Reveal>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-14">
        <Reveal>
          <h2 className="font-display text-2xl text-white">Luna, espejo lateral o retrovisor: ¿cuál es la diferencia?</h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted">
            <p>
              <span className="font-semibold text-white">Luna de espejo:</span> solo el vidrio reflectivo. Es la pieza
              que se cambia cuando únicamente se rompe o se daña el reflejo.
            </p>
            <p>
              <span className="font-semibold text-white">Espejo lateral:</span> el espejo exterior completo, con su
              carcasa y su vidrio. Se cambia cuando la carcasa también está dañada.
            </p>
            <p>
              <span className="font-semibold text-white">Retrovisor:</span> es el nombre general de los espejos del
              vehículo. El que va por fuera del carro se conoce como espejo lateral.
            </p>
            <p>Si no sabes cuál necesitas, una foto del espejo nos ayuda a identificarlo.</p>
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-14">
        <Reveal>
          <h2 className="font-display text-2xl text-white">Hacemos la búsqueda según tu vehículo</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Para encontrar la pieza correcta necesitamos estos datos. Con ellos podemos confirmarte disponibilidad por
            WhatsApp:
          </p>
          <ul className="mt-4 grid grid-cols-1 gap-2 text-sm text-muted sm:grid-cols-2">
            {BUSQUEDA.map((b) => (
              <li key={b} className="card px-4 py-3 text-white/90">
                {b}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Atendemos vehículos de distintas marcas. Si nos envías una foto del espejo o de la luna, la búsqueda es más
            rápida.
          </p>
        </Reveal>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-14">
        <Reveal>
          <h2 className="font-display text-2xl text-white">Instalación y atención en Pereira</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            La instalación se hace en nuestro local, en el barrio La Victoria, Pereira, Risaralda. Atendemos en Pereira y
            también hacemos envíos a toda Colombia, así que puedes consultarnos desde cualquier ciudad.
          </p>
        </Reveal>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-14">
        <Reveal>
          <h2 className="font-display text-2xl text-white">Trabajos realizados</h2>
        </Reveal>
        <Reveal delay={80}>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <FotoPublica
                key={i}
                slotKey={`lunas-galeria-${i}`}
                fotos={fotos}
                alts={alts}
                className="aspect-square rounded-xl border border-white/8"
              />
            ))}
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-14">
        <Reveal>
          <h2 className="font-display text-2xl text-white">Preguntas frecuentes</h2>
          <div className="mt-5 divide-y divide-white/8 border-y border-white/8">
            {FAQ.map((f) => (
              <details key={f.p} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-white">
                  {f.p}
                  <span className="text-brand-500 transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-muted">{f.r}</p>
              </details>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-14">
        <Reveal>
          <h2 className="font-display text-2xl text-white">Otros servicios para tu vehículo</h2>
        </Reveal>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {OTROS_SERVICIOS.map((s, i) => (
            <Reveal key={s.id} delay={i * 60}>
              <Link
                to={s.path}
                className="card group flex h-full flex-col p-5 transition hover:-translate-y-0.5 hover:border-brand-600/50"
              >
                <p className="text-base font-semibold text-white">{s.nombre}</p>
                <p className="mt-1.5 text-sm text-muted">{s.desc}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-500 group-hover:text-brand-400">
                  Ver más
                  <ArrowUpRight size={14} />
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-14 text-center">
        <Reveal>
          <h2 className="font-display text-2xl text-white" style={{ textWrap: 'balance' }}>
            ¿Se te rompió una luna?
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Escríbenos ahora y te decimos si la tenemos disponible. También puedes <Link to="/contacto" className="text-brand-500 hover:text-brand-400">ver nuestra ubicación</Link>.
          </p>
          <a
            href={WHATSAPP_LUNAS}
            target="_blank"
            rel="noreferrer"
            data-cta="cierre"
            className="btn-primary mt-6 inline-flex"
          >
            <WhatsAppIcon size={16} />
            Escríbenos por WhatsApp
          </a>
        </Reveal>
      </section>
    </div>
  )
}
