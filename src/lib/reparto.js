// Espejo (solo para preview en UI) del calculo que hace la funcion
// registrar_venta() en Postgres, que es la fuente de verdad real.
// Usa redondeo por residuo para que los tres montos siempre sumen
// exactamente baseReparto (ver comentario en 0001_init.sql).
export function calcularReparto(montoTotal, costoTotal) {
  const baseReparto = round2(montoTotal - costoTotal)
  const montoMecanico = round2(baseReparto * 0.5)
  const resto = round2(baseReparto - montoMecanico)
  const montoDuena = round2(resto * 0.5)
  const montoSocio = round2(resto - montoDuena)

  return { baseReparto, montoMecanico, montoDuena, montoSocio }
}

function round2(n) {
  return Math.round(n * 100) / 100
}
