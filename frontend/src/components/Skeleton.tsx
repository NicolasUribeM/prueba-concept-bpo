/**
 * Skeleton — Esqueletos de carga animados (efecto "shimmer").
 * Se muestran mientras llegan los datos para dar sensación de fluidez en lugar
 * de un texto plano de "Cargando...".
 */
export function SkeletonRow() {
  return (
    <tr className="skeleton-row">
      <td><span className="skeleton" style={{ width: 28 }} /></td>
      <td><span className="skeleton" style={{ width: '70%' }} /></td>
      <td><span className="skeleton" style={{ width: 80 }} /></td>
      <td><span className="skeleton" style={{ width: 70 }} /></td>
    </tr>
  );
}

export function SkeletonCard() {
  return (
    <div className="glass metric-card">
      <span className="skeleton" style={{ width: '50%', height: 12 }} />
      <span className="skeleton" style={{ width: '70%', height: 26, marginTop: 12 }} />
    </div>
  );
}
