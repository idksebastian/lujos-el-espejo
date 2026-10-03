import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, ArrowUpRight, Sparkles } from 'lucide-react'
import Reveal from '../../components/public/Reveal'
import LineWaves from '../../components/public/LineWaves'
import WhatsAppIcon from '../../components/public/WhatsAppIcon'
import FotoPublica from '../../components/public/FotoPublica'
import JsonLd from '../../components/public/JsonLd'
import { CATEGORIAS, DIAGNOSTICO, DIRECCION, WHATSAPP_HREF, buildJsonLd, whatsappHref } from '../../lib/publicContent'
import { GALERIA_HOME, useSitioFotos } from '../../lib/sitioFotos'
import { useSeo } from '../../lib/useSeo'

function HeroMedia() {
  const [videoError, setVideoError] = useState(false)

  if (videoError) {
    return (
      <div className="absolute inset-0 bg-ink">
        <div className="absolute inset-0 opacity-35">
          <LineWaves
            speed={0.2}
            rotation={-30}
            brightness={0.18}
            warpIntensity={0.7}
            color1="#e01a2b"
            color2="#8c0c18"
            color3="#ffffff"
            enableMouseInteraction={false}
          />
        </div>
        <div className="absolute inset-0 bg-linear-to-b from-ink/50 via-ink/70 to-ink" />
      </div>
    )
  }

  return (
    <>
      {/* Se activa solo si existe /hero.mp4 — si no, cae a la animación de
          arriba sin romper nada. Sin poster a propósito: un poster se ve
          instantáneamente mientras el navegador todavía está intentando
          cargar el video, así que mostrar el logo ahí solo produce un
          parpadeo del logo antes de caer a la animación. Para poner un
          video real: exporta un clip corto (10-20s) de trabajo real en el
          taller, sin audio importante (queda muteado), y guárdalo como
          public/hero.mp4. */}
      <video autoPlay muted loop playsInline className="absolute inset-0 size-full object-cover opacity-40">
        {/* El error se escucha en <source>, no en <video>: si /hero.mp4 no
            carga, el navegador dispara el evento sobre el source. */}
        <source src="/hero.mp4" type="video/mp4" onError={() => setVideoError(true)} />
      </video>
      <div className="absolute inset-0 bg-linear-to-b from-ink/60 via-ink/70 to-ink" />
    </>
  )
}

export default function HomePage() {
  const { fotos, alts } = useSitioFotos()
  useSeo({
    title: 'Lunas y accesorios para carros en Pereira | Lujos El Espejo',
    description:
      'Encuentra lunas, espejos, plumillas, bombillería y accesorios para carros en Pereira. Venta, reparación e instalación en Lujos El Espejo.',
    path: '/',
  })

  return (
    <div>
      <JsonLd data={buildJsonLd()} />

      <section className="relative overflow-hidden">
        <HeroMedia />
        <div className="relative mx-auto max-w-3xl px-5 py-20 text-center sm:py-28">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-brand-500">
            Barrio La Victoria · Pereira
          </p>
          <h1 className="font-display text-4xl leading-tight text-white sm:text-5xl" style={{ textWrap: 'balance' }}>
            Lunas y accesorios para carros en Pereira
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-base text-muted">
            Fabricamos y conseguimos lunas difíciles de encontrar, con instalación incluida. También plumillas,
            bombillería y protección antirrobo para tu vehículo.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a href={WHATSAPP_HREF} target="_blank" rel="noreferrer" data-cta="hero" className="btn-primary">
              <WhatsAppIcon size={16} />
              Escríbenos por WhatsApp
            </a>
            <Link to="/lunas" className="btn-secondary">
              Ver lunas
            </Link>
          </div>

          <div className="mx-auto mt-14 max-w-lg border-t border-white/8 pt-7">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">¿Qué le pasó a tu carro?</p>
            <div className="flex flex-wrap justify-center gap-2">
              {DIAGNOSTICO.map((d) => (
                <a
                  key={d.problema}
                  href={whatsappHref(d.mensaje)}
                  target="_blank"
                  rel="noreferrer"
                  data-cta="diagnostico"
                  className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white transition hover:border-brand-500 hover:bg-brand-600/10"
                >
                  {d.problema}
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-14 text-center">
        <Reveal>
          <span className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-brand-600/15 text-brand-500">
            <Sparkles size={18} />
          </span>
          <h2 className="font-display text-2xl text-white">¿Qué se le dañó a tu carro?</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted">
            Si se te rompió una luna, se te fundió un bombillo o necesitas cambiar las plumillas, aquí lo
            resolvemos. Y si no lo tenemos en el momento, te lo conseguimos.
          </p>
        </Reveal>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-14">
        <Reveal>
          <h2 className="font-display text-2xl text-white">Encuentra tu solución</h2>
        </Reveal>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          {CATEGORIAS.map((c, i) => (
            <Reveal
              key={c.nombre}
              delay={i * 60}
              className="w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.667rem)]"
            >
              <Link
                to={c.path}
                className={`card group flex h-full flex-col p-5 transition hover:-translate-y-0.5 hover:border-brand-600/50 ${c.destacado ? 'ring-1 ring-brand-600/40' : ''}`}
              >
                {c.destacado && (
                  <span className="mb-2 inline-block w-fit rounded-full bg-brand-600/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-500">
                    Especialidad
                  </span>
                )}
                <p className="text-base font-semibold text-white">{c.nombre}</p>
                <p className="mt-1.5 text-sm text-muted">{c.desc}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-500 group-hover:text-brand-400">
                  Ver más
                  <ArrowUpRight size={14} />
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-14">
        <Reveal>
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-display text-2xl text-white">Nuestro trabajo</h2>
            <Link
              to="/productos"
              className="hidden shrink-0 items-center gap-1 text-sm font-medium text-brand-500 hover:text-brand-400 sm:inline-flex"
            >
              Ver más fotos
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </Reveal>
        <Reveal delay={80}>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {GALERIA_HOME.map((slotKey) => (
              <FotoPublica
                key={slotKey}
                slotKey={slotKey}
                fotos={fotos}
                alts={alts}
                className="aspect-square rounded-xl border border-white/8"
              />
            ))}
          </div>
          <Link
            to="/productos"
            className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-500 hover:text-brand-400 sm:hidden"
          >
            Ver más fotos
            <ArrowUpRight size={14} />
          </Link>
        </Reveal>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-14">
        <Reveal>
          <div className="card flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-600/15 text-brand-500">
                <MapPin size={18} />
              </span>
              <div>
                <p className="text-sm font-semibold text-white">{DIRECCION}</p>
                <p className="text-sm text-muted">Lunes a sábado, 8:00 a.m. – 5:00 p.m.</p>
              </div>
            </div>
            <Link to="/contacto" className="btn-secondary shrink-0">
              Ver ubicación
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-14 text-center">
        <Reveal>
          <h2 className="font-display text-2xl text-white" style={{ textWrap: 'balance' }}>
            ¿Necesitas una luna, un repuesto o una cotización a medida?
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Escríbenos por WhatsApp y te respondemos rápido — decinos la marca, línea y año de tu vehículo.
          </p>
          <a
            href={WHATSAPP_HREF}
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
