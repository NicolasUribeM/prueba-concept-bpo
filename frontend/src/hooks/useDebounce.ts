/**
 * useDebounce — Retrasa la actualización de un valor hasta que el usuario deja
 * de escribir durante 'delay' ms. Evita recalcular/filtrar en cada pulsación,
 * clave para que la UI no se ralentice con volúmenes grandes de datos.
 */
import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delay = 300): T {
  const [valorRetrasado, setValorRetrasado] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setValorRetrasado(value), delay);
    return () => clearTimeout(id); // limpia el timer si el valor cambia antes
  }, [value, delay]);

  return valorRetrasado;
}
