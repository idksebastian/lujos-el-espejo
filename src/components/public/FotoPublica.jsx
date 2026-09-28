// Muestra la foto real subida desde /admin/sitio-web para este slot, o el
// degradado placeholder mientras no exista una — así las páginas públicas
// no dependen de que las fotos ya estén cargadas para verse bien.
export default function FotoPublica({ slotKey, fotos, className = '' }) {
  const url = fotos?.[slotKey]

  if (url) {
    return <img src={url} alt="" loading="lazy" className={`${className} object-cover`} />
  }

  return <div className={`${className} bg-linear-to-br from-surface to-surface-2`} />
}
