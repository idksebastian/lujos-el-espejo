import { SECCIONES_FOTOS, useSitioFotos } from '../../lib/sitioFotos'
import FotoSlotAdmin from '../../components/admin/FotoSlotAdmin'

export default function SitioWebPage() {
  const { fotos, alts, cargando, recargar } = useSitioFotos()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl text-white">Página web</h1>
        <p className="mt-1 text-sm text-muted">
          Sube aquí las fotos que aparecen en lujoselespejo.com — cada cuadro corresponde exactamente a un espacio de
          la página pública. Puedes recortar la foto antes de guardarla, y cambiarla cuando quieras con "Editar".
        </p>
      </div>

      {cargando && <p className="text-sm text-muted">Cargando…</p>}

      {!cargando &&
        SECCIONES_FOTOS.map((seccion) => (
          <div key={seccion.titulo}>
            <h2 className="mb-3 text-sm font-semibold text-white/80">{seccion.titulo}</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {seccion.slots.map((slotKey) => (
                <FotoSlotAdmin
                  key={slotKey}
                  slotKey={slotKey}
                  url={fotos[slotKey]}
                  alt={alts[slotKey]}
                  onGuardado={recargar}
                />
              ))}
            </div>
          </div>
        ))}
    </div>
  )
}
