// Datos y textos compartidos entre todas las páginas públicas del sitio
// (no confundir con /admin — esto es solo para el sitio de cara al público).

export const WHATSAPP = '573202642451'
export const DIRECCION = 'Cra 12 #29-02, Barrio La Victoria, Pereira, Risaralda'

// La búsqueda del mapa va sin barrio/departamento a propósito: entre más
// texto se le pase al geocodificador de Google, más se confunde con
// direcciones colombianas de este formato (carrera/calle + número).
export const MAPA_QUERY = encodeURIComponent('Cra 12 #29-02, Pereira, Colombia')

// Mensaje genérico para cuando no hay una página/problema específico detrás
// del botón (ej. el header o el botón flotante en /, /contacto). No dice
// literalmente "vengo de la página" — eso suena forzado viniendo de un
// cliente real — pero tampoco es el típico "hola, tienen disponibilidad
// de...". Habla en términos de problema/solución, que es como está armado
// todo el sitio, así que quien lo lea del lado del negocio lo va a poder
// distinguir de un mensaje que llega por cualquier otro medio.
const MENSAJE_GENERICO = 'Hola, tengo un problema con mi carro y quiero que me ayuden a solucionarlo'

export function whatsappHref(mensaje = MENSAJE_GENERICO) {
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(mensaje)}`
}

export const WHATSAPP_HREF = whatsappHref()

export const CATEGORIAS = [
  {
    id: 'lunas',
    grupo: 'lunas',
    path: '/lunas',
    nombre: 'Lunas para carro y moto',
    desc: 'Vidrios y espejos a la medida, instalación incluida — nuestra especialidad.',
    destacado: true,
  },
  {
    id: 'plumillas',
    grupo: 'servicios',
    path: '/servicios/plumillas',
    nombre: 'Plumillas',
    desc: 'Cambio de plumillas para todo tipo de vehículo.',
  },
  {
    id: 'bombilleria',
    grupo: 'servicios',
    path: '/servicios/bombilleria',
    nombre: 'Bombillería',
    desc: 'Bombillos y luces LED para carro y moto, en el momento.',
  },
  {
    id: 'proteccion-antirrobo',
    grupo: 'servicios',
    path: '/servicios/proteccion-antirrobo',
    nombre: 'Protección antirrobo',
    desc: 'Aseguramos emblemas, antenas y lunas para que sea casi imposible desmontarlos.',
  },
  {
    id: 'identicar',
    grupo: 'servicios',
    path: '/servicios/identicar',
    nombre: 'Identicar',
    desc: 'Grabamos tu placa u otro diseño personalizado directamente en la luna, a tu medida.',
  },
]

export const SERVICIOS_GENERALES = CATEGORIAS.filter((c) => c.grupo === 'servicios')

// Da el mensaje de WhatsApp más específico posible según la página en la
// que esté el visitante — así el botón de "Escríbenos" del header y el
// flotante (que aparecen en todo el sitio) no mandan siempre el mismo
// mensaje genérico, sino uno que coincide con lo que la persona estaba
// viendo justo antes de escribir.
export function mensajeParaRuta(pathname) {
  const categoria = CATEGORIAS.find((c) => c.path === pathname)
  if (!categoria) return MENSAJE_GENERICO
  return categoria.grupo === 'lunas'
    ? 'Hola, necesito cotizar una luna para mi vehículo'
    : `Hola, quiero información sobre ${categoria.nombre.toLowerCase()}`
}

// Chips de "¿qué le pasó a tu carro?" — reemplazan el bloque de
// estadísticas de TikTok en el hero. Cada uno abre WhatsApp con un mensaje
// ya redactado según el problema puntual, en vez de mandar a todos al
// mismo mensaje genérico.
export const DIAGNOSTICO = [
  { problema: 'Se me rompió el vidrio', mensaje: 'Hola, se me rompió el vidrio/luna de mi carro o moto y necesito una nueva' },
  { problema: 'Se me fundió una luz', mensaje: 'Hola, se me fundió un bombillo/luz y necesito cambiarlo' },
  { problema: 'Necesito cambiar las plumillas', mensaje: 'Hola, necesito cambiar las plumillas de mi carro' },
  { problema: 'Quiero asegurar mi carro', mensaje: 'Hola, quiero asegurar los emblemas, antenas o lunas de mi carro para que no me los roben' },
  { problema: 'Otro', mensaje: 'Hola, tengo un problema con mi carro y no estoy seguro qué necesito, ¿me pueden ayudar?' },
]

export function buildJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'AutomotiveBusiness',
    name: 'Lujos El Espejo 2',
    description:
      'Lunas para carro y moto, plumillas, bombillería, seguros e identicar, en el barrio La Victoria, Pereira.',
    image: 'https://lujoselespejo.com/logo-horizontal.png',
    telephone: '+573202642451',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Cra 12 #29-02',
      addressLocality: 'Pereira',
      addressRegion: 'Risaralda',
      addressCountry: 'CO',
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      opens: '08:00',
      closes: '17:00',
    },
    sameAs: ['https://www.tiktok.com/@lujoselespejo'],
    makesOffer: CATEGORIAS.map((s) => ({
      '@type': 'Offer',
      itemOffered: { '@type': 'Service', name: s.nombre, description: s.desc },
    })),
  }
}
