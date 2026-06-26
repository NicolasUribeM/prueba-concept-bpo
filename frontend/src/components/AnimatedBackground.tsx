/**
 * AnimatedBackground — Fondo "aurora" animado.
 * Capas de gradientes azules difuminados que se desplazan lentamente sobre un
 * fondo casi negro, más una malla sutil. Puramente CSS (ver index.css) para
 * máximo rendimiento. Se monta fijo detrás de todo el contenido.
 */
export function AnimatedBackground() {
  return (
    <div className="aurora" aria-hidden="true">
      <div className="aurora__blob aurora__blob--1" />
      <div className="aurora__blob aurora__blob--2" />
      <div className="aurora__blob aurora__blob--3" />
      <div className="aurora__grid" />
    </div>
  );
}
