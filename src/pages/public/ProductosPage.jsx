import WhatsAppIcon from '../../components/public/WhatsAppIcon'
import Reveal from '../../components/public/Reveal'
import FotoPublica from '../../components/public/FotoPublica'
import JsonLd from '../../components/public/JsonLd'
import { CATEGORIAS, WHATSAPP_HREF, buildBreadcrumbJsonLd } from '../../lib/publicContent'
import { useSitioFotos } from '../../lib/sitioFotos'
import { useSeo } from '../../lib/useSeo'

// Nota: esto es un catálogo fotográfico curado, no una búsqueda en vivo
// contra el inventario real. Si mostráramos disponibilidad en tiempo real,
// un producto agotado o no listado se leería como "no lo tienen" y
// espantaría al cliente — mejor mostrar el trabajo real y dejar que
// pregunten por WhatsApp lo puntual.

export default function ProductosPage() {
  const { fotos, alts } = useSitioFotos()
  useSeo({
    title: 'Trabajos y accesorios para carros en Pereira | Lujos El Espejo',
    description:
      'Trabajos reales de lunas, plumillas, bombillería, protección antirrobo e Identicar, hechos en nuestro local del barrio La Victoria, Pereira.',
    path: '/productos',
  })

  return (
    <div>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { nombre: 'Inicio', path: '/' },
          { nombre: 'Trabajos', path: '/productos' },
        ])}
      />

      <section className="mx-auto max-w-3xl px-5 py-16 text-center sm:py-20">
        <Reveal>
          <h1 className="font-display text-4xl leading-tight text-white sm:text-5xl" style={{ textWrap: 'balance' }}>
            Trabajos y accesorios para carros
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-base text-muted">
            Una muestra de lo que manejamos. Si no ves tu referencia exacta, seguro la tenemos o te la conseguimos —
            pregúntanos por WhatsApp.
          </p>
        </Reveal>
      </section>

      {CATEGORIAS.map((cat) => (
        <section key={cat.id} className="mx-auto max-w-5xl px-5 pb-14">
          <Reveal>
            <h2 className="font-display text-xl text-white">{cat.nombre}</h2>
          </Reveal>
          <Reveal delay={60}>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <FotoPublica
                  key={i}
                  slotKey={`productos-${cat.id}-${i}`}
                  fotos={fotos}
                  alts={alts}
                  className="aspect-square rounded-xl border border-white/8"
                />
              ))}
            </div>
          </Reveal>
        </section>
      ))}

      <section className="mx-auto max-w-3xl px-5 py-14 text-center">
        <Reveal>
          <h2 className="font-display text-2xl text-white" style={{ textWrap: 'balance' }}>
            ¿Buscas algo puntual?
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Cuéntanos qué necesitas y te confirmamos disponibilidad enseguida.
          </p>
          <a href={WHATSAPP_HREF} target="_blank" rel="noreferrer" data-cta="cierre" className="btn-primary mt-6 inline-flex">
            <WhatsAppIcon size={16} />
            Preguntar por WhatsApp
          </a>
        </Reveal>
      </section>
    </div>
  )
}
