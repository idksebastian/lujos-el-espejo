import { MapPin, Clock, Truck, Phone, ArrowUpRight } from 'lucide-react'
import WhatsAppIcon from '../../components/public/WhatsAppIcon'
import Reveal from '../../components/public/Reveal'
import JsonLd from '../../components/public/JsonLd'
import { DIRECCION, MAPA_QUERY, WHATSAPP, WHATSAPP_HREF, buildBreadcrumbJsonLd } from '../../lib/publicContent'
import { useSeo } from '../../lib/useSeo'

export default function ContactoPage() {
  useSeo({
    title: 'Contacto y ubicación en Pereira | Lujos El Espejo',
    description: 'Visítanos en el barrio La Victoria, Pereira, o escríbenos por WhatsApp. Dirección, horario y mapa.',
    path: '/contacto',
  })

  return (
    <div>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { nombre: 'Inicio', path: '/' },
          { nombre: 'Contacto', path: '/contacto' },
        ])}
      />

      <section className="mx-auto max-w-3xl px-5 py-16 text-center sm:py-20">
        <Reveal>
          <h1 className="font-display text-4xl leading-tight text-white sm:text-5xl" style={{ textWrap: 'balance' }}>
            Encuéntranos en Pereira
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-base text-muted">
            Estamos en el barrio La Victoria, en Cra 12 #29-02, Pereira, Risaralda. Aquí puedes consultar por lunas y
            espejos para carro y moto, plumillas, bombillería, protección antirrobo e Identicar. Si no puedes venir,
            escríbenos por WhatsApp y te respondemos.
          </p>
        </Reveal>
      </section>

      <section className="mx-auto max-w-5xl px-5 pb-16">
        <Reveal>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.2fr]">
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
              <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-600/15 text-brand-500">
                  <Phone size={18} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">Teléfono</p>
                  <a href={`tel:+${WHATSAPP}`} data-cta="contacto" className="text-sm text-muted hover:text-white">
                    +57 320 264 2451
                  </a>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <a href={WHATSAPP_HREF} target="_blank" rel="noreferrer" data-cta="contacto" className="btn-primary">
                  <WhatsAppIcon size={16} />
                  Escríbenos por WhatsApp
                </a>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${MAPA_QUERY}`}
                  target="_blank"
                  rel="noreferrer"
                  data-cta="contacto"
                  className="btn-secondary"
                >
                  Cómo llegar
                  <ArrowUpRight size={14} />
                </a>
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl border border-white/8">
              <iframe
                title="Mapa de ubicación de Lujos El Espejo en Cra 12 #29-02, Pereira"
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
    </div>
  )
}
