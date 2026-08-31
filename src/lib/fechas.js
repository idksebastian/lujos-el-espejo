// Convierte una fecha "YYYY-MM-DD" (elegida en un <input type="date">, en la
// zona horaria local del navegador) al rango UTC real de ese día calendario.
//
// Enviar el string naive "2026-08-28T00:00:00" directo a Supabase hace que
// PostgREST lo interprete en UTC, no en la zona horaria local. En Bogotá
// (UTC-5) una venta de las 8pm queda guardada como ~01:00 UTC del día
// siguiente, y ese filtro naive la pierde por completo. Al construir un
// Date real a partir del string (que el motor JS sí interpreta en hora
// local) y convertirlo con toISOString(), obtenemos el instante UTC
// correcto sin importar la zona horaria del dispositivo.
export function rangoDiaLocal(fechaISO) {
  const desde = new Date(`${fechaISO}T00:00:00`)
  const hasta = new Date(`${fechaISO}T23:59:59.999`)
  return { desde: desde.toISOString(), hasta: hasta.toISOString() }
}
