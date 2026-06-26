/**
 * Charts — Mini-dashboards visuales (Recharts) bajo las tarjetas de métricas.
 * Cuatro gráficos alimentados por /records/stats (datos del tenant):
 *   1. Dona: distribución de registros por estado.
 *   2. Barras: monto acumulado por estado.
 *   3. Área: tendencia de registros creados por fecha (últimos 30 días).
 *   4. Barras: conteo de registros por estado.
 * Todos respetan el estilo glass y la paleta azul de la app.
 */
import { motion } from 'framer-motion';
import {
  PieChart, Pie, Cell,
  BarChart, Bar,
  AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import type { Estadisticas } from '../store/recordsSlice';

// Colores por estado (coinciden con los badges de la tabla).
const COLOR = { ACTIVO: '#34d399', PENDIENTE: '#fbbf24', ARCHIVADO: '#94a3b8' };

// Estilo común del tooltip oscuro (look glass).
const tooltipStyle = {
  background: 'rgba(12, 18, 32, 0.92)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 12,
  fontSize: 12,
  color: '#e8edf8',
};

const formatoCorto = (n: number) =>
  n >= 1000 ? `$${(n / 1000).toFixed(0)}k` : `$${n}`;

function ChartCard({
  titulo,
  children,
  delay,
}: {
  titulo: string;
  children: React.ReactNode;
  delay: number;
}) {
  return (
    <motion.div
      className="glass chart-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.7, ease: [0.22, 0.61, 0.36, 1] }}
    >
      <h4 className="chart-title">{titulo}</h4>
      <div className="chart-body">{children}</div>
    </motion.div>
  );
}

export function Charts({ stats }: { stats: Estadisticas | null }) {
  if (!stats) return null;

  const dataEstado = [
    { name: 'Activo', key: 'ACTIVO', value: stats.porEstado.ACTIVO },
    { name: 'Pendiente', key: 'PENDIENTE', value: stats.porEstado.PENDIENTE },
    { name: 'Archivado', key: 'ARCHIVADO', value: stats.porEstado.ARCHIVADO },
  ];

  const dataMonto = [
    { name: 'Activo', key: 'ACTIVO', monto: stats.montoPorEstado.ACTIVO },
    { name: 'Pendiente', key: 'PENDIENTE', monto: stats.montoPorEstado.PENDIENTE },
    { name: 'Archivado', key: 'ARCHIVADO', monto: stats.montoPorEstado.ARCHIVADO },
  ];

  // Para la tendencia mostramos día/mes corto en el eje X.
  const dataTendencia = stats.tendencia.map((t) => ({
    fecha: t.fecha.slice(5), // MM-DD
    total: t.total,
  }));

  return (
    <div className="charts-grid">
      <ChartCard titulo="Distribución por estado" delay={0.05}>
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={dataEstado}
              dataKey="value"
              nameKey="name"
              innerRadius={45}
              outerRadius={70}
              paddingAngle={3}
              stroke="none"
            >
              {dataEstado.map((d) => (
                <Cell key={d.key} fill={COLOR[d.key as keyof typeof COLOR]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
        <div className="chart-legend">
          {dataEstado.map((d) => (
            <span key={d.key} className="legend-item">
              <span className="legend-dot" style={{ background: COLOR[d.key as keyof typeof COLOR] }} />
              {d.name}
            </span>
          ))}
        </div>
      </ChartCard>

      <ChartCard titulo="Monto por estado" delay={0.12}>
        <ResponsiveContainer width="100%" height={210}>
          <BarChart data={dataMonto} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: '#9aa6bd', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={formatoCorto} tick={{ fill: '#5d6982', fontSize: 11 }} axisLine={false} tickLine={false} width={42} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatoCorto(v)} cursor={{ fill: 'rgba(59,130,246,0.08)' }} />
            <Bar dataKey="monto" radius={[6, 6, 0, 0]}>
              {dataMonto.map((d) => (
                <Cell key={d.key} fill={COLOR[d.key as keyof typeof COLOR]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard titulo="Tendencia de registros (30 días)" delay={0.19}>
        <ResponsiveContainer width="100%" height={210}>
          <AreaChart data={dataTendencia} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="gradArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="fecha" tick={{ fill: '#5d6982', fontSize: 10 }} axisLine={false} tickLine={false} interval={4} />
            <YAxis tick={{ fill: '#5d6982', fontSize: 11 }} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: 'rgba(59,130,246,0.3)' }} />
            <Area type="monotone" dataKey="total" stroke="#60a5fa" strokeWidth={2} fill="url(#gradArea)" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard titulo="Conteo por estado" delay={0.26}>
        <ResponsiveContainer width="100%" height={210}>
          <BarChart data={dataEstado} layout="vertical" margin={{ top: 4, right: 12, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
            <XAxis type="number" tick={{ fill: '#5d6982', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <YAxis type="category" dataKey="name" tick={{ fill: '#9aa6bd', fontSize: 11 }} axisLine={false} tickLine={false} width={70} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(59,130,246,0.08)' }} />
            <Bar dataKey="value" radius={[0, 6, 6, 0]}>
              {dataEstado.map((d) => (
                <Cell key={d.key} fill={COLOR[d.key as keyof typeof COLOR]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
