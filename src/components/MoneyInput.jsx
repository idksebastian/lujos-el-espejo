// Campo para montos en pesos: mientras se escribe, muestra el número
// formateado con puntos de miles (es-CO), pero el valor que se reporta al
// padre (onChange) es siempre el número puro sin formato, para que el
// resto del código lo use igual que antes.
export default function MoneyInput({ value, onChange, className = '', ...props }) {
  function handleChange(e) {
    const soloDigitos = e.target.value.replace(/\D/g, '')
    onChange(soloDigitos)
  }

  const mostrado = value ? Number(value).toLocaleString('es-CO') : ''

  return (
    <input
      type="text"
      inputMode="numeric"
      value={mostrado}
      onChange={handleChange}
      onWheel={(e) => e.currentTarget.blur()}
      className={`input ${className}`}
      {...props}
    />
  )
}
