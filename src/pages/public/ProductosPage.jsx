import WhatsAppIcon from '../../components/public/WhatsAppIcon'
import Reveal from '../../components/public/Reveal'
import { WHATSAPP_HREF } from '../../lib/publicContent'

// Nota: esto es un catálogo fotográfico curado, no una búsqueda en vivo
// contra el inventario real. Si mostráramos disponibilidad en tiempo real,
// un producto agotado o no listado se leería como "no lo tienen" y
// espantaría al cliente — mejor mostrar el trabajo real y dejar que
// pregunten por WhatsApp lo puntual.
const CATEGORIAS_FOTOS = ['Lunas', 'Espejos', 'Plumillas', 'Bombillería', 'Accesorios']

export default function ProductosPage() {
  return (
    <div>
      <section className="mx-auto max-w-3xl px-5 py-16 text-center sm:py-20">
        <Reveal>
          <h1 className="font-display text-4xl leading-tight text-white sm:text-5xl" style={{ textWrap: 'balance' }}>
            Nuestro trabajo
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-base text-muted">
            Una muestra de lo que manejamos. Si no ves tu referencia exacta, seguro la tenemos o te la conseguimos —
            pregúntanos por WhatsApp.
          </p>
        </Reveal>
      </section>

      {CATEGORIAS_FOTOS.map((cat, ci) => (
        <section key={cat} className="mx-auto max-w-5xl px-5 pb-14">
          <Reveal>
            <h2 className="font-display text-xl text-white">{cat}</h2>
          </Reveal>
          <Reveal delay={60}>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="aspect-square rounded-xl border border-white/8 bg-linear-to-br from-surface to-surface-2"
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
          <a href={WHATSAPP_HREF} target="_blank" rel="noreferrer" className="btn-primary mt-6 inline-flex">
            <WhatsAppIcon size={16} />
            Preguntar por WhatsApp
          </a>
        </Reveal>
      </section>
    </div>
  )
}
