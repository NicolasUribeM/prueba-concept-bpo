/**
 * MetricCards — Fila de tarjetas con métricas del tenant (total, monto y
 * desglose por estado). Los datos vienen del endpoint /records/stats, siempre
 * filtrados por tenant en el backend. Mientras cargan, muestra skeletons.
 */
import { motion } from 'framer-motion';
import type { Estadisticas } from '../store/recordsSlice';
import { SkeletonCard } from './Skeleton';

const formatoMoneda = (n: number) =>
  '$' + n.toLocaleString('es-CO', { maximumFractionDigits: 0 });

export function MetricCards({ stats }: { stats: Estadisticas | null }) {
  if (!stats) {
    return (
      <div className="metrics-grid">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  const tarjetas = [
    { etiqueta: 'Registros totales', valor: stats.total.toLocaleString('es-CO'), color: 'blue' },
    { etiqueta: 'Monto acumulado', valor: formatoMoneda(stats.montoTotal), color: 'cyan' },
    { etiqueta: 'Activos', valor: stats.porEstado.ACTIVO.toLocaleString('es-CO'), color: 'green' },
    { etiqueta: 'Pendientes', valor: stats.porEstado.PENDIENTE.toLocaleString('es-CO'), color: 'yellow' },
  ];

  return (
    <div className="metrics-grid">
      {tarjetas.map((t, i) => (
        <motion.div
          key={t.etiqueta}
          className="glass metric-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06, type: 'spring', stiffness: 240, damping: 24 }}
        >
          <span className="metric-label">{t.etiqueta}</span>
          <span className={`metric-value metric-${t.color}`}>{t.valor}</span>
        </motion.div>
      ))}
    </div>
  );
}
