// Lógica del formulario "Consultar una luna por WhatsApp" de /lunas.
// Pura (sin React ni analytics) para poder probarla por separado.

import { whatsappHref } from './publicContent'

export const LADOS = ['Izquierdo', 'Derecho']
export const PROBLEMAS = ['Luna partida', 'Luna rota', 'Luna rayada', 'Luna faltante', 'Otro']

const ANIO_MINIMO = 1950

export function validarConsultaLuna(valores) {
  const errores = {}
  const anio = valores.anio.trim()
  const anioMaximo = new Date().getFullYear() + 1

  if (!valores.marca.trim()) errores.marca = 'Escribe la marca del vehículo'
  if (!valores.modelo.trim()) errores.modelo = 'Escribe el modelo o línea'

  if (!anio) errores.anio = 'Escribe el año'
  else if (!/^\d{4}$/.test(anio) || Number(anio) < ANIO_MINIMO || Number(anio) > anioMaximo) {
    errores.anio = `Escribe un año válido, entre ${ANIO_MINIMO} y ${anioMaximo}`
  }

  if (!LADOS.includes(valores.lado)) errores.lado = 'Elige el lado del vehículo'
  if (!PROBLEMAS.includes(valores.problema)) errores.problema = 'Elige qué le pasó a la luna'

  return errores
}

export function buildMensajeConsultaLuna(valores) {
  return [
    'Hola, quiero consultar una luna para mi vehículo.',
    '',
    `Marca: ${valores.marca.trim()}`,
    `Modelo: ${valores.modelo.trim()}`,
    `Año: ${valores.anio.trim()}`,
    `Lado: ${valores.lado}`,
    `Problema: ${valores.problema}`,
    '',
    'Quisiera consultar disponibilidad y precio.',
  ].join('\n')
}

// whatsappHref ya aplica encodeURIComponent al mensaje y usa el número comercial.
export function buildUrlConsultaLuna(valores) {
  return whatsappHref(buildMensajeConsultaLuna(valores))
}

// Marca y modelo son texto libre: se envían a analytics solo si parecen una
// descripción de vehículo. Se descarta cualquier valor que pueda ser un dato
// personal (correo, teléfono o texto largo).
function textoSeguroParaAnalytics(texto) {
  const limpio = texto.trim().toLowerCase()
  if (!limpio || limpio.length > 40) return undefined
  if (limpio.includes('@') || /\d{6,}/.test(limpio)) return undefined
  return limpio
}

export function parametrosAnalyticsConsultaLuna(valores) {
  return {
    vehicle_brand: textoSeguroParaAnalytics(valores.marca),
    vehicle_model: textoSeguroParaAnalytics(valores.modelo),
    vehicle_year: valores.anio.trim(),
    vehicle_side: valores.lado,
    problem: valores.problema,
  }
}
