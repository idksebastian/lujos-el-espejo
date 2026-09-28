import { useParams, Navigate, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import Reveal from '../../components/public/Reveal'
import WhatsAppIcon from '../../components/public/WhatsAppIcon'
import FotoPublica from '../../components/public/FotoPublica'
import { CATEGORIAS, whatsappHref, mensajeParaRuta } from '../../lib/publicContent'
import { useSitioFotos } from '../../lib/sitioFotos'

// Pasos genéricos válidos para cualquier servicio — hasta que el negocio
// nos cuente el proceso real de cada uno (pendiente para la próxima
// jornada de fotos), esto describe honestamente cómo funciona sin
// inventar detalles técnicos específicos del servicio.
const PASOS_GENERICOS = [
  { titulo: 'Cuéntanos qué necesitas', desc: 'Escríbenos por WhatsApp contándonos qué se te dañó o qué buscas.' },
  { titulo: 'Te confirmamos', desc: 'Revisamos si lo tenemos disponible y cómo lo resolvemos.' },
  { titulo: 'Lo resolvemos en el local', desc: 'Nos visitas en el barrio La Victoria, Pereira, y lo solucionamos ahí mismo.' },
]

export default function ServicioDetallePage() {
  const { id } = useParams()
  const { fotos } = useSitioFotos()
  const servicio = CATEGORIAS.find((c) => c.id === id && c.grupo === 'servicios')

  if (!servicio) return <Navigate to="/servicios" replace />

  const whatsappServicio = whatsappHref(mensajeParaRuta(servicio.path))

  return (
    <div>
      <section className="mx-auto max-w-3xl px-5 py-16 text-center sm:py-20">
        <Reveal>
          <Link to="/servicios" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-white">
            <ArrowLeft size={14} />
            Todos los servicios
          </Link>
          <h1 className="font-display text-4xl leading-tight text-white sm:text-5xl" style={{ textWrap: 'balance' }}>
            {servicio.nombre}
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-base text-muted">{servicio.desc}</p>
          <a href={whatsappServicio} target="_blank" rel="noreferrer" className="btn-primary mt-8 inline-flex">
            <WhatsAppIcon size={16} />
            Preguntar por WhatsApp
          </a>
        </Reveal>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-14">
        <Reveal>
          <h2 className="font-display text-2xl text-white">Cómo funciona</h2>
        </Reveal>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {PASOS_GENERICOS.map((p, i) => (
            <Reveal key={p.titulo} delay={i * 80}>
              <div className="card h-full p-5">
                <span className="flex size-8 items-center justify-center rounded-lg bg-brand-600/15 text-sm font-semibold text-brand-500">
                  {i + 1}
                </span>
                <p className="mt-3 text-base font-semibold text-white">{p.titulo}</p>
                <p className="mt-1.5 text-sm text-muted">{p.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

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
                className="aspect-square rounded-xl border border-white/8"
              />
            ))}
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-14 text-center">
        <Reveal>
          <h2 className="font-display text-2xl text-white" style={{ textWrap: 'balance' }}>
            ¿Tienes esta necesidad?
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">Escríbenos y te ayudamos enseguida.</p>
          <a href={whatsappServicio} target="_blank" rel="noreferrer" className="btn-primary mt-6 inline-flex">
            <WhatsAppIcon size={16} />
            Escríbenos por WhatsApp
          </a>
        </Reveal>
      </section>
    </div>
  )
}
