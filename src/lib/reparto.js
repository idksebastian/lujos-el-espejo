// Espejo (solo para preview en UI) del calculo que hace la funcion
// registrar_venta() en Postgres, que es la fuente de verdad real.
// Usa redondeo por residuo para que los tres montos siempre sumen
// exactamente baseReparto (ver comentario en 0001_init.sql).
export function calcularReparto(montoTotal, costoTotal, hayMecanico = true) {
  const baseReparto = round2(montoTotal - costoTotal)

  // Sin mecánico (producto vendido sin instalación), no hay a quién darle
  // el 50% de mano de obra: los dos socios se reparten toda la ganancia
  // por igual en vez de 50/25/25.
  if (!hayMecanico) {
    const montoDuena = round2(baseReparto * 0.5)
    const montoSocio = round2(baseReparto - montoDuena)
    return { baseReparto, montoMecanico: 0, montoDuena, montoSocio }
  }

  const montoMecanico = round2(baseReparto * 0.5)
  const resto = round2(baseReparto - montoMecanico)
  const montoDuena = round2(resto * 0.5)
  const montoSocio = round2(resto - montoDuena)

  return { baseReparto, montoMecanico, montoDuena, montoSocio }
}

function round2(n) {
  return Math.round(n * 100) / 100
}
