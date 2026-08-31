// Genera las imágenes de factura/cierre dibujando directamente en un
// <canvas>, en vez de "fotografiar" un pedazo de HTML (lo que se hacía
// antes con html2canvas). Un <canvas> dibujado a mano con fillText/lineTo
// se ve pixel por pixel igual en cualquier navegador/celular, porque no
// depende de que ese navegador interprete flexbox/CSS igual que el nuestro
// — que es justo lo que se rompía en producción aunque funcionara bien en
// las pruebas de escritorio.
import JsBarcode from 'jsbarcode'

const FUENTE = '"Courier New", Courier, monospace'
const ANCHO = 320
const MARGEN = 18
const ALTO_MAXIMO = 3000

function money(n) {
  return Number(n).toLocaleString('es-CO')
}

class ReciboBuilder {
  constructor() {
    this.y = 22
    this.scale = 3
    this.canvas = document.createElement('canvas')
    this.canvas.width = ANCHO * this.scale
    this.canvas.height = ALTO_MAXIMO * this.scale
    this.ctx = this.canvas.getContext('2d')
    this.ctx.scale(this.scale, this.scale)
    this.ctx.fillStyle = '#ffffff'
    this.ctx.fillRect(0, 0, ANCHO, ALTO_MAXIMO)
    this.ctx.fillStyle = '#000000'
    this.ctx.textBaseline = 'top'
  }

  centrado(texto, { bold = false, size = 13 } = {}) {
    this.ctx.font = `${bold ? 'bold ' : ''}${size}px ${FUENTE}`
    const w = this.ctx.measureText(texto).width
    this.ctx.fillText(texto, (ANCHO - w) / 2, this.y)
    this.y += size + 7
  }

  fila(izq, der, { bold = false, size = 12 } = {}) {
    this.ctx.font = `${bold ? 'bold ' : ''}${size}px ${FUENTE}`
    this.ctx.fillText(this._truncar(izq, ANCHO - MARGEN * 2 - this.ctx.measureText(der).width - 8), MARGEN, this.y)
    const wDer = this.ctx.measureText(der).width
    this.ctx.fillText(der, ANCHO - MARGEN - wDer, this.y)
    this.y += size + 7
  }

  _truncar(texto, anchoDisponible) {
    if (this.ctx.measureText(texto).width <= anchoDisponible) return texto
    let recortado = texto
    while (recortado.length > 1 && this.ctx.measureText(recortado + '…').width > anchoDisponible) {
      recortado = recortado.slice(0, -1)
    }
    return recortado + '…'
  }

  linea({ punteada = true, grosor = 1 } = {}) {
    this.y += 3
    this.ctx.save()
    this.ctx.strokeStyle = '#000000'
    this.ctx.lineWidth = grosor
    this.ctx.setLineDash(punteada ? [3, 3] : [])
    this.ctx.beginPath()
    this.ctx.moveTo(MARGEN, this.y)
    this.ctx.lineTo(ANCHO - MARGEN, this.y)
    this.ctx.stroke()
    this.ctx.restore()
    this.y += 9
  }

  espacio(px = 8) {
    this.y += px
  }

  barcode(valor) {
    const barcodeCanvas = document.createElement('canvas')
    try {
      JsBarcode(barcodeCanvas, valor, { format: 'CODE128', displayValue: false, height: 40, margin: 0 })
    } catch {
      return // valor invalido para codificar; se omite el barcode, no es critico
    }
    const anchoDestino = ANCHO - MARGEN * 2
    const altoDestino = 40 * (anchoDestino / barcodeCanvas.width)
    this.ctx.drawImage(barcodeCanvas, MARGEN, this.y, anchoDestino, altoDestino)
    this.y += altoDestino + 6
    this.centrado(valor, { size: 10 })
  }

  finalizar() {
    const alturaFinal = Math.ceil(this.y + 16)
    const final = document.createElement('canvas')
    final.width = ANCHO * this.scale
    final.height = alturaFinal * this.scale
    final.getContext('2d').drawImage(this.canvas, 0, 0)
    return new Promise((resolve) => final.toBlob((blob) => resolve(blob), 'image/png'))
  }
}

export function generarFacturaPng({ folio, fecha, cliente, items, servicios, montoTotal, nit }) {
  const r = new ReciboBuilder()
  r.centrado('LUJOS EL ESPEJO', { bold: true, size: 15 })
  r.centrado('Accesorios y lujos para autos', { size: 10 })
  if (nit?.numero) r.centrado(`NIT: ${nit.numero}`, { size: 10 })
  r.linea()

  r.fila('Comprobante:', folio, { size: 10 })
  r.fila('Fecha:', fecha, { size: 10 })
  if (cliente) r.fila('Cliente:', cliente, { size: 10 })
  r.linea()

  if (items?.length > 0) {
    r.fila('PRODUCTO', 'CANT.', { size: 10 })
    for (const item of items) r.fila(item.nombre, String(item.cantidad))
    r.espacio(4)
  }

  if (servicios?.length > 0) {
    r.fila('SERVICIO', 'MONTO', { size: 10 })
    for (const s of servicios) r.fila(s.descripcion, `$${money(s.monto)}`)
    r.espacio(4)
  }

  r.linea({ punteada: false, grosor: 2 })
  r.fila('TOTAL', `$${money(montoTotal)}`, { bold: true, size: 15 })
  const totalArticulos = (items?.reduce((s, i) => s + i.cantidad, 0) ?? 0) + (servicios?.length ?? 0)
  r.fila('Total artículos', String(totalArticulos), { size: 10 })
  r.linea()

  r.barcode(folio)
  r.espacio(6)
  r.centrado('¡Gracias por su compra!', { size: 10 })

  return r.finalizar()
}

export function generarCierrePng({
  folio,
  fecha,
  totalVendido,
  totalNeto,
  numVentas,
  totalServicios,
  numServicios,
  repartoTotal,
  porMecanico,
  ventas,
  devoluciones,
  gastos,
  nombreSocio1,
  nombreSocio2,
}) {
  const r = new ReciboBuilder()

  r.centrado('LUJOS EL ESPEJO', { bold: true, size: 15 })
  r.centrado(`Cierre del día — ${fecha}`, { size: 10 })
  r.linea()

  r.fila('Total vendido:', `$${money(totalVendido)}`, { size: 11 })
  if (devoluciones?.length > 0) r.fila('Neto (con devoluciones):', `$${money(totalNeto)}`, { size: 11 })
  r.fila('Ventas realizadas:', String(numVentas), { size: 11 })
  r.fila('Servicios especiales:', `${numServicios} ($${money(totalServicios)})`, { size: 11 })
  r.linea()

  if (devoluciones?.length > 0) {
    const totalDevuelto = devoluciones.reduce((s, d) => s + d.montoDevuelto, 0)
    r.centrado('DEVOLUCIONES Y GARANTÍAS', { bold: true, size: 11 })
    r.espacio(4)
    for (const d of devoluciones) {
      const etiqueta =
        d.tipo === 'dinero'
          ? `Devolución $${money(d.montoDevuelto)}`
          : d.tipo === 'cambio'
            ? `Cambio${d.producto ? ` (${d.producto})` : ''}`
            : 'Reparación gratuita'
      r.fila(d.folio, etiqueta, { size: 10 })
    }
    if (totalDevuelto > 0) r.fila('Total devuelto:', `$${money(totalDevuelto)}`, { size: 10 })
    r.linea()
  }

  if (gastos?.length > 0) {
    const totalGastos = gastos.reduce((s, g) => s + g.monto, 0)
    r.centrado('GASTOS DEL DÍA', { bold: true, size: 11 })
    r.espacio(4)
    for (const g of gastos) {
      const sufijo = g.reparto === 'socio1' ? ` (${nombreSocio1})` : g.reparto === 'socio2' ? ` (${nombreSocio2})` : ''
      r.fila(g.descripcion + sufijo, `$${money(g.monto)}`, { size: 10 })
    }
    r.fila('Total gastos:', `$${money(totalGastos)}`, { size: 10 })
    r.linea()
  }

  // Cada persona por su nombre — nada de agrupar a los mecánicos bajo una
  // sola categoría genérica "Mecánicos".
  r.centrado('CUÁNTO GANÓ CADA UNO', { bold: true, size: 11 })
  r.espacio(4)
  for (const m of porMecanico ?? []) {
    r.fila(m.nombre, `$${money(m.totalCorresponde)}`, { bold: true, size: 12 })
  }
  r.fila(nombreSocio1, `$${money(repartoTotal.duena)}`, { bold: true, size: 12 })
  r.fila(nombreSocio2, `$${money(repartoTotal.socio)}`, { bold: true, size: 12 })

  if (porMecanico?.length > 0) {
    r.linea()
    r.centrado('VENTAS GENERADAS POR MECÁNICO', { size: 10 })
    for (const m of porMecanico) {
      r.fila(m.nombre, `$${money(m.totalGenerado)}`, { size: 10 })
    }
  }

  if (ventas?.length > 0) {
    r.linea()
    r.fila('HORA / MECÁNICO', 'MONTO', { size: 10 })
    for (const v of ventas) {
      r.fila(`${v.hora} - ${v.mecanicoNombre}`, `$${money(v.montoTotal)}`, { size: 10 })
    }
  }

  r.linea()
  r.barcode(folio)

  return r.finalizar()
}
