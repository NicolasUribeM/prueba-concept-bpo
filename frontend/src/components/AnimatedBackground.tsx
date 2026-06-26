/**
 * AnimatedBackground — Fondo "aurora" animado.
 * Orbes de gradiente azul que recorren TODA la pantalla con trayectorias
 * amplias y distintas. En cada carga arrancan en una posición y fase aleatoria
 * (posición inicial + animation-delay negativo), de modo que nunca se ven igual
 * ni se apilan siempre en el mismo punto. Puramente CSS para máximo rendimiento.
 */
import { useMemo } from 'react';

export function AnimatedBackground() {
  // Posición inicial y desfase aleatorios por orbe (estables durante el montaje).
  const orbes = useMemo(
    () =>
      [1, 2, 3, 4].map((i) => ({
        i,
        left: Math.round(Math.random() * 80 - 10), // -10% .. 70%
        top: Math.round(Math.random() * 80 - 10),
        delay: -Math.round(Math.random() * 40), // arranca en una fase distinta
      })),
    []
  );

  return (
    <div className="aurora" aria-hidden="true">
      {orbes.map((o) => (
        <div
          key={o.i}
          className={`aurora__blob aurora__blob--${o.i}`}
          style={{ left: `${o.left}%`, top: `${o.top}%`, animationDelay: `${o.delay}s` }}
        />
      ))}
    </div>
  );
}
