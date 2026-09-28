function cargarImagen(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.addEventListener('load', () => resolve(img))
    img.addEventListener('error', reject)
    img.crossOrigin = 'anonymous'
    img.src = src
  })
}

// Recorta `src` según el rectángulo en píxeles que entrega react-easy-crop
// (pixelCrop) y devuelve un Blob JPEG cuadrado listo para subir — el
// recorte queda "horneado" en el archivo final, así que en el sitio público
// no hace falta ninguna lógica de posicionamiento, solo <img object-cover>.
export async function recortarImagenABlob(src, pixelCrop, ladoSalida = 800) {
  const imagen = await cargarImagen(src)
  const canvas = document.createElement('canvas')
  canvas.width = ladoSalida
  canvas.height = ladoSalida
  const ctx = canvas.getContext('2d')

  ctx.drawImage(
    imagen,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    ladoSalida,
    ladoSalida
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('No se pudo generar la imagen recortada'))),
      'image/jpeg',
      0.9
    )
  })
}
