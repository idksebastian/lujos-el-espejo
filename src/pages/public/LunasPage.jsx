import { Car, Search, PackageCheck } from 'lucide-react'
import WhatsAppIcon from '../../components/public/WhatsAppIcon'
import Reveal from '../../components/public/Reveal'
import { whatsappHref } from '../../lib/publicContent'

const WHATSAPP_LUNAS = whatsappHref('Hola, necesito cotizar una luna para mi vehículo')

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

export default function LunasPage() {
  return (
    <div>
      <section className="mx-auto max-w-3xl px-5 py-16 text-center sm:py-20">
        <Reveal>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-brand-500">Nuestra especialidad</p>
          <h1 className="font-display text-4xl leading-tight text-white sm:text-5xl" style={{ textWrap: 'balance' }}>
            Lunas para carro y moto
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-base text-muted">
            Vidrios y espejos a la medida, incluso las referencias más difíciles de encontrar. Si no la tenemos ahí
            mismo, te la conseguimos.
          </p>
          <a href={WHATSAPP_LUNAS} target="_blank" rel="noreferrer" className="btn-primary mt-8 inline-flex">
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

      <section className="mx-auto max-w-5xl px-5 py-14">
        <Reveal>
          <h2 className="font-display text-2xl text-white">Trabajos realizados</h2>
        </Reveal>
        <Reveal delay={80}>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="aspect-square rounded-xl border border-white/8 bg-linear-to-br from-surface to-surface-2"
              />
            ))}
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-14 text-center">
        <Reveal>
          <h2 className="font-display text-2xl text-white" style={{ textWrap: 'balance' }}>
            ¿Se te rompió una luna?
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Escríbenos ahora y te decimos si la tenemos disponible.
          </p>
          <a href={WHATSAPP_LUNAS} target="_blank" rel="noreferrer" className="btn-primary mt-6 inline-flex">
            <WhatsAppIcon size={16} />
            Escríbenos por WhatsApp
          </a>
        </Reveal>
      </section>
    </div>
  )
}
