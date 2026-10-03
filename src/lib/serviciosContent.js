// Contenido propio de cada página de servicio (/servicios/:id). Todo lo que
// va aquí describe lo que el negocio ya ofrece según su catálogo; no hay
// precios, tiempos ni detalles técnicos inventados. Si el negocio confirma
// algo nuevo (por ejemplo, si un servicio se hace a domicilio), se agrega aquí.
//
// instalacion: texto cuando el servicio implica un cambio/instalación en el
// local, o null cuando no aplica (ej. Identicar solo graba la luna).

export const SERVICIOS_DETALLE = {
  plumillas: {
    title: 'Plumillas para carros en Pereira | Lujos El Espejo',
    meta: 'Cambio de plumillas para tu carro en Pereira. Buscamos la medida según marca, línea y año. Cotiza por WhatsApp.',
    h1: 'Cambio de plumillas para tu carro',
    intro:
      'Unas plumillas gastadas dejan rayas en el vidrio, limpian a medias o hacen ruido al pasar. Te cambiamos la medida correcta para tu vehículo en nuestro local del barrio La Victoria, Pereira.',
    problema:
      'Con lluvia, ver bien por el parabrisas depende de que el limpiaparabrisas funcione. Cambiar las plumillas a tiempo evita que la visibilidad se reduzca cuando más la necesitas.',
    incluye: [
      'Cambio de plumillas para todo tipo de vehículo',
      'Búsqueda de la medida según la marca, la línea y el año de tu carro',
      'Atención en el local, sin tener que buscar la referencia por tu cuenta',
    ],
    instalacion:
      'Te las cambiamos en el local. Si no tenemos tu medida en el momento, te la consultamos y te confirmamos.',
    relacionados: ['bombilleria', 'proteccion-antirrobo'],
    faq: [
      {
        p: '¿Cómo sé qué medida de plumillas necesita mi carro?',
        r: 'Depende de la marca, la línea y el año. Envíanos esos datos por WhatsApp y te confirmamos la medida antes de cambiarlas.',
      },
      {
        p: '¿Cambian plumillas de cualquier marca?',
        r: 'Atendemos vehículos de distintas marcas. Si no tenemos tu medida en el momento, la consultamos y te respondemos.',
      },
      {
        p: '¿Cómo sé que ya es hora de cambiarlas?',
        r: 'Si dejan rayas o manchas en el vidrio, no limpian bien o hacen ruido al pasar, ya están gastadas.',
      },
    ],
  },

  bombilleria: {
    title: 'Bombillería para carros en Pereira | Lujos El Espejo',
    meta: 'Bombillos y luces LED para carro y moto en Pereira. Si lo tenemos disponible, lo cambiamos en el momento.',
    h1: 'Cambio de bombillos y luces LED',
    intro:
      'Bombillos y luces LED para carro y moto. Si lo tenemos disponible, lo cambiamos en el momento en nuestro local del barrio La Victoria, Pereira.',
    problema:
      'Una luz fundida reduce tu visibilidad en la vía, sobre todo de noche, y también la de tu vehículo para los demás conductores. Es una falla sencilla de resolver si la cambias pronto.',
    incluye: [
      'Bombillos y luces LED para carro y moto',
      'Cambio en el momento si hay disponibilidad',
      'Búsqueda del bombillo según el vehículo cuando no lo tenemos a la mano',
    ],
    instalacion: 'El cambio se hace en el local. Si no lo tenemos, te lo conseguimos.',
    relacionados: ['plumillas', 'proteccion-antirrobo'],
    faq: [
      {
        p: '¿Qué bombillo necesita mi carro?',
        r: 'Depende del vehículo y de la luz. Escríbenos la marca, la línea y el año, y si puedes, una foto del bombillo actual.',
      },
      {
        p: '¿Lo cambian en el momento?',
        r: 'Si lo tenemos disponible, sí. Si no, te lo conseguimos.',
      },
      {
        p: '¿Venden luces LED para moto?',
        r: 'Sí, manejamos bombillería LED para carro y moto. Pregúntanos por la referencia que necesitas.',
      },
    ],
  },

  'proteccion-antirrobo': {
    title: 'Protección antirrobo para carros en Pereira | Lujos El Espejo',
    meta: 'Protección antirrobo para emblemas, antenas y lunas de tu carro en Pereira. Hacemos más difícil que te las desmonten.',
    h1: 'Protección antirrobo para emblemas, antenas y lunas',
    intro:
      'Aseguramos emblemas, antenas y lunas de tu vehículo para que sea muy difícil desmontarlos. Lo hacemos en nuestro local del barrio La Victoria, Pereira.',
    problema:
      'Estas piezas son fáciles de llevarse y cuestan dinero reponerlas. Asegurarlas hace que el robo sea mucho más difícil y te evita perder un accesorio que ya pagaste.',
    incluye: [
      'Aseguramiento de emblemas',
      'Aseguramiento de antenas',
      'Aseguramiento de lunas',
    ],
    instalacion:
      'Lo hacemos en el local. Cuéntanos qué piezas quieres asegurar y te respondemos por WhatsApp.',
    relacionados: ['identicar', 'bombilleria'],
    faq: [
      {
        p: '¿Qué piezas pueden asegurar?',
        r: 'Emblemas, antenas y lunas. Si necesitas proteger otra pieza, consúltanos por WhatsApp.',
      },
      {
        p: '¿Es imposible que me las roben?',
        r: 'Ningún sistema es 100 % infalible. Nuestro objetivo es que desmontarlas sea muy difícil.',
      },
      {
        p: '¿Puedo asegurar varias piezas a la vez?',
        r: 'Sí. Cuéntanos cuáles quieres asegurar y te confirmamos lo que podemos hacer para tu vehículo.',
      },
    ],
  },

  identicar: {
    title: 'Identicar para carros en Pereira | Lujos El Espejo',
    meta: 'Identicar en Pereira: grabamos tu placa u otro diseño personalizado directamente en la luna de tu carro.',
    h1: 'Identicar: tu placa grabada en la luna',
    intro:
      'Grabamos tu placa u otro diseño personalizado directamente en la luna de tu vehículo, a tu medida, en nuestro local del barrio La Victoria, Pereira.',
    problema:
      'Con la placa grabada en la luna, tu vehículo queda marcado y se puede identificar más fácilmente. Es una forma sencilla de dejar tu carro identificado sin cambiar nada más.',
    incluye: [
      'Grabado de tu placa en la luna',
      'Diseños personalizados a tu medida',
      'Trabajo directo sobre la luna del vehículo',
    ],
    instalacion: null,
    relacionados: ['proteccion-antirrobo', 'bombilleria'],
    faq: [
      {
        p: '¿Qué puedo grabar en la luna?',
        r: 'Tu placa o un diseño personalizado. Cuéntanos qué quieres por WhatsApp y te confirmamos.',
      },
      {
        p: '¿Para qué sirve el Identicar?',
        r: 'Marca tu vehículo con tu placa o un diseño propio, lo que ayuda a identificarlo.',
      },
      {
        p: '¿Dónde lo hacen?',
        r: 'En nuestro local, en el barrio La Victoria, Pereira. Consulta el horario en la página de contacto.',
      },
    ],
  },
}
