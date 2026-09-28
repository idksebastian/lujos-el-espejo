import { useEffect } from 'react'

const SITIO = 'https://lujoselespejo.com'
const IMAGEN_DEFECTO = `${SITIO}/logo-horizontal.png`

// El sitio público es un SPA sin SSR: index.html trae un solo
// title/description/canonical fijos (los que ve cualquier bot que no
// ejecute JS). Google sí renderiza JS antes de indexar, así que esto
// corrige esos tres tags por ruta para que cada página compita por sus
// propias palabras clave en vez de que todas queden como copias de "/".
export function useSeo({ title, description, path, image = IMAGEN_DEFECTO }) {
  useEffect(() => {
    document.title = title
    setMeta('description', description)
    setMeta('og:title', title, 'property')
    setMeta('og:description', description, 'property')
    setMeta('og:url', `${SITIO}${path}`, 'property')
    setMeta('og:image', image, 'property')
    setCanonical(`${SITIO}${path}`)
  }, [title, description, path, image])
}

function setMeta(nombre, contenido, atributo = 'name') {
  let tag = document.querySelector(`meta[${atributo}="${nombre}"]`)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(atributo, nombre)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', contenido)
}

function setCanonical(href) {
  let link = document.querySelector('link[rel="canonical"]')
  if (!link) {
    link = document.createElement('link')
    link.setAttribute('rel', 'canonical')
    document.head.appendChild(link)
  }
  link.setAttribute('href', href)
}
