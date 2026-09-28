import { MessageCircle, MapPin, Clock, Truck, Phone, ArrowUpRight } from 'lucide-react'
import Reveal from '../../components/public/Reveal'
import { DIRECCION, MAPA_QUERY, WHATSAPP, WHATSAPP_HREF } from '../../lib/publicContent'

export default function ContactoPage() {
  return (
    <div>
      <section className="mx-auto max-w-3xl px-5 py-16 text-center sm:py-20">
        <Reveal>
          <h1 className="font-display text-4xl leading-tight text-white sm:text-5xl" style={{ textWrap: 'balance' }}>
            Contáctanos
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-base text-muted">
            Escríbenos por WhatsApp o visítanos en el barrio La Victoria, Pereira.
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
                  <a href={`tel:+${WHATSAPP}`} className="text-sm text-muted hover:text-white">
                    +57 320 264 2451
                  </a>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <a href={WHATSAPP_HREF} target="_blank" rel="noreferrer" className="btn-primary">
                  <MessageCircle size={16} />
                  Escríbenos por WhatsApp
                </a>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${MAPA_QUERY}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary"
                >
                  Cómo llegar
                  <ArrowUpRight size={14} />
                </a>
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl border border-white/8">
              <iframe
                title="Ubicación de Lujos El Espejo 2"
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
