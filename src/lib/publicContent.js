// Datos y textos compartidos entre todas las páginas públicas del sitio
// (no confundir con /admin — esto es solo para el sitio de cara al público).

export const WHATSAPP = '573202642451'
export const DIRECCION = 'Cra 12 #29-02, Barrio La Victoria, Pereira, Risaralda'

// La búsqueda del mapa va sin barrio/departamento a propósito: entre más
// texto se le pase al geocodificador de Google, más se confunde con
// direcciones colombianas de este formato (carrera/calle + número).
export const MAPA_QUERY = encodeURIComponent('Cra 12 #29-02, Pereira, Colombia')

export function whatsappHref(mensaje = 'Hola, quiero información sobre sus productos') {
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(mensaje)}`
}

export const WHATSAPP_HREF = whatsappHref()

export const CATEGORIAS = [
  {
    slug: 'lunas',
    nombre: 'Lunas para carro y moto',
    corta: 'Lunas',
    desc: 'Vidrios y espejos a la medida, instalación incluida — nuestra especialidad.',
    destacado: true,
  },
  {
    slug: 'servicios',
    nombre: 'Plumillas',
    corta: 'Plumillas',
    desc: 'Cambio de plumillas para todo tipo de vehículo.',
  },
  {
    slug: 'servicios',
    nombre: 'Bombillería',
    corta: 'Bombillería',
    desc: 'Bombillos y luces LED para carro y moto, en el momento.',
  },
  {
    slug: 'servicios',
    nombre: 'Seguros',
    corta: 'Seguros',
    desc: 'Asesoría y trámite de seguros para tu vehículo.',
  },
  {
    slug: 'servicios',
    nombre: 'Identicar',
    corta: 'Identicar',
    desc: 'Trámite de identificación vehicular.',
  },
]

export const SERVICIOS_GENERALES = CATEGORIAS.filter((c) => c.slug === 'servicios')

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
