import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import WhatsAppIcon from '../../components/public/WhatsAppIcon'
import Reveal from '../../components/public/Reveal'
import JsonLd from '../../components/public/JsonLd'
import { SERVICIOS_GENERALES, WHATSAPP_HREF, buildBreadcrumbJsonLd } from '../../lib/publicContent'
import { useSeo } from '../../lib/useSeo'

export default function ServiciosPage() {
  useSeo({
    title: 'Plumillas, bombillería y más para tu carro en Pereira | Lujos El Espejo',
    description:
      'Cambio de plumillas, bombillos LED, protección antirrobo e Identicar para tu carro o moto en Pereira, barrio La Victoria.',
    path: '/servicios',
  })

  return (
    <div>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { nombre: 'Inicio', path: '/' },
          { nombre: 'Servicios', path: '/servicios' },
        ])}
      />

      <section className="mx-auto max-w-3xl px-5 py-16 text-center sm:py-20">
        <Reveal>
          <h1 className="font-display text-4xl leading-tight text-white sm:text-5xl" style={{ textWrap: 'balance' }}>
            Otros servicios para tu vehículo
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-base text-muted">
            Además de lunas, resolvemos lo demás que necesita tu carro o moto en el día a día.
          </p>
        </Reveal>
      </section>

      <section className="mx-auto max-w-5xl px-5 pb-16">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {SERVICIOS_GENERALES.map((s, i) => (
            <Reveal key={s.nombre} delay={i * 60}>
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
            ¿No encuentras lo que buscas?
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Escríbenos por WhatsApp — manejamos más referencias de las que alcanzamos a mostrar aquí.
          </p>
          <a href={WHATSAPP_HREF} target="_blank" rel="noreferrer" data-cta="cierre" className="btn-primary mt-6 inline-flex">
            <WhatsAppIcon size={16} />
            Escríbenos por WhatsApp
          </a>
        </Reveal>
      </section>
    </div>
  )
}
