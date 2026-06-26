/**
 * AnimatedBackground — Fondo "aurora" animado.
 * Varios orbes de gradiente azul con recorridos amplios y lentos que se mezclan
 * como una aurora boreal sobre un fondo casi negro. Puramente CSS (ver
 * index.css) para máximo rendimiento. Se monta fijo detrás del contenido.
 */
export function AnimatedBackground() {
  return (
    <div className="aurora" aria-hidden="true">
      <div className="aurora__blob aurora__blob--1" />
      <div className="aurora__blob aurora__blob--2" />
      <div className="aurora__blob aurora__blob--3" />
      <div className="aurora__blob aurora__blob--4" />
    </div>
  );
}
