import { useParams, Navigate, Link } from 'react-router-dom'
import { ArrowLeft, ArrowUpRight, Check } from 'lucide-react'
import Reveal from '../../components/public/Reveal'
import WhatsAppIcon from '../../components/public/WhatsAppIcon'
import FotoPublica from '../../components/public/FotoPublica'
import JsonLd from '../../components/public/JsonLd'
import {
  CATEGORIAS,
  buildBreadcrumbJsonLd,
  buildServicioJsonLd,
  whatsappHref,
  mensajeParaRuta,
} from '../../lib/publicContent'
import { SERVICIOS_DETALLE } from '../../lib/serviciosContent'
import { useSitioFotos } from '../../lib/sitioFotos'
import { useSeo } from '../../lib/useSeo'

export default function ServicioDetallePage() {
  const { id } = useParams()
  const { fotos, alts } = useSitioFotos()
  const servicio = CATEGORIAS.find((c) => c.id === id && c.grupo === 'servicios')
  const detalle = servicio ? SERVICIOS_DETALLE[servicio.id] : null

  useSeo({
    title: detalle?.title ?? 'Servicios | Lujos El Espejo',
    description: detalle?.meta ?? 'Servicios para tu carro o moto en Pereira, barrio La Victoria.',
    path: servicio ? servicio.path : '/servicios',
  })

  if (!servicio || !detalle) return <Navigate to="/servicios" replace />

  const whatsappServicio = whatsappHref(mensajeParaRuta(servicio.path))
  const relacionados = [
    ...detalle.relacionados.map((rid) => CATEGORIAS.find((c) => c.id === rid)),
    CATEGORIAS.find((c) => c.id === 'lunas'),
  ]

  return (
    <div>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { nombre: 'Inicio', path: '/' },
          { nombre: 'Servicios', path: '/servicios' },
          { nombre: servicio.nombre, path: servicio.path },
        ])}
      />
      <JsonLd data={buildServicioJsonLd(servicio)} />

      <section className="mx-auto max-w-3xl px-5 py-16 text-center sm:py-20">
        <Reveal>
          <Link to="/servicios" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-white">
            <ArrowLeft size={14} />
            Todos los servicios
          </Link>
          <h1 className="font-display text-4xl leading-tight text-white sm:text-5xl" style={{ textWrap: 'balance' }}>
            {detalle.h1}
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-base text-muted">{detalle.intro}</p>
          <a
            href={whatsappServicio}
            target="_blank"
            rel="noreferrer"
            data-cta="hero"
            className="btn-primary mt-8 inline-flex"
          >
            <WhatsAppIcon size={16} />
            Preguntar por WhatsApp
          </a>
        </Reveal>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-14">
        <Reveal>
          <h2 className="font-display text-2xl text-white">Qué problema resuelve</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">{detalle.problema}</p>
        </Reveal>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-14">
        <Reveal>
          <h2 className="font-display text-2xl text-white">Qué incluye</h2>
          <ul className="mt-4 space-y-3">
            {detalle.incluye.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-muted">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-brand-600/15 text-brand-500">
                  <Check size={14} />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </Reveal>
      </section>

      {detalle.instalacion && (
        <section className="mx-auto max-w-3xl px-5 py-14">
          <Reveal>
            <h2 className="font-display text-2xl text-white">Instalación</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">{detalle.instalacion}</p>
          </Reveal>
        </section>
      )}

      <section className="mx-auto max-w-5xl px-5 py-14">
        <Reveal>
          <h2 className="font-display text-2xl text-white">Trabajos realizados</h2>
        </Reveal>
        <Reveal delay={80}>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <FotoPublica
                key={i}
                slotKey={`servicio-${servicio.id}-${i}`}
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
            {detalle.faq.map((f) => (
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
          <h2 className="font-display text-2xl text-white">Servicios relacionados</h2>
        </Reveal>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {relacionados.map((s, i) => (
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
            ¿Tienes esta necesidad?
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Escríbenos y te ayudamos enseguida. Si necesitas ubicarnos, estamos en el barrio La Victoria, Pereira.
          </p>
          <a
            href={whatsappServicio}
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
