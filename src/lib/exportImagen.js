export function descargarBlob(blob, nombreArchivo) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombreArchivo
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

// La Web Share API (compartir directo a WhatsApp, etc.) a veces entrega el
// archivo de forma que la app receptora no lo deja abrir bien. Por eso la
// imagen SIEMPRE se descarga primero (queda guardada y visible de una vez);
// compartir es una acción aparte y explícita, no un intento automático que
// cae a "descargar" en silencio si falla.
export function puedeCompartirArchivo(blob, nombreArchivo) {
  try {
    const archivo = new File([blob], nombreArchivo, { type: 'image/png' })
    return !!(navigator.canShare && navigator.canShare({ files: [archivo] }))
  } catch {
    return false
  }
}

export async function compartirArchivo(blob, nombreArchivo, textoCompartir) {
  const archivo = new File([blob], nombreArchivo, { type: 'image/png' })
  await navigator.share({ files: [archivo], title: nombreArchivo, text: textoCompartir })
}
