/**
 * Charts — Mini-dashboards visuales (Recharts) bajo las tarjetas de métricas.
 *   1. Dona: distribución de registros por estado.
 *   2. Barras: monto acumulado por estado (con valor visible en la barra).
 *   3. Área: tendencia de registros creados, con filtro 30/60/120 días.
 *   4. Barras: conteo de registros por estado (con valor visible en la barra).
 * Tooltips personalizados y legibles. Estilo glass + paleta azul.
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  PieChart, Pie, Cell,
  BarChart, Bar, LabelList,
  AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { useAppDispatch } from '../store/hooks';
import { fetchStats } from '../store/recordsSlice';
import type { Estadisticas } from '../store/recordsSlice';

const COLOR = { ACTIVO: '#34d399', PENDIENTE: '#fbbf24', ARCHIVADO: '#94a3b8' };
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

const formatoMoneda = (n: number) =>
  n >= 1000 ? `$${(n / 1000).toFixed(0)}k` : `$${Math.round(n)}`;

// "2026-06-12" -> "12 jun"
function fechaCorta(iso: string) {
  const [, m, d] = iso.split('-').map(Number);
  return `${d} ${MESES[(m ?? 1) - 1]}`;
}

/** Tooltip genérico: muestra etiqueta + valor grande y con color. */
function TipPersonalizado({
  active,
  payload,
  tipoMoneda,
}: {
  active?: boolean;
  payload?: any[];
  tipoMoneda?: boolean;
}) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0].payload;
  const color = COLOR[p.key as keyof typeof COLOR] ?? '#60a5fa';
  const valor = tipoMoneda
    ? `$${Number(p.valor).toLocaleString('es-CO')}`
    : Number(p.valor).toLocaleString('es-CO');
  return (
    <div className="chart-tip">
      <span className="chart-tip-label" style={{ color }}>{p.name}</span>
      <span className="chart-tip-value" style={{ color }}>{valor}</span>
    </div>
  );
}

/** Tooltip de la tendencia (fecha + cantidad). */
function TipTendencia({ active, payload }: { active?: boolean; payload?: any[] }) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0].payload;
  return (
    <div className="chart-tip">
      <span className="chart-tip-label" style={{ color: '#60a5fa' }}>{p.fechaLarga}</span>
      <span className="chart-tip-value" style={{ color: '#60a5fa' }}>
        {p.total} registros
      </span>
    </div>
  );
}

function ChartCard({
  titulo,
  extra,
  children,
  delay,
}: {
  titulo: string;
  extra?: React.ReactNode;
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
      <div className="chart-header">
        <h4 className="chart-title">{titulo}</h4>
        {extra}
      </div>
      <div className="chart-body">{children}</div>
    </motion.div>
  );
}

export function Charts({ stats }: { stats: Estadisticas | null }) {
  const dispatch = useAppDispatch();
  const [rango, setRango] = useState(30);

  if (!stats) return null;

  const dataEstado = [
    { name: 'Activo', key: 'ACTIVO', valor: stats.porEstado.ACTIVO },
    { name: 'Pendiente', key: 'PENDIENTE', valor: stats.porEstado.PENDIENTE },
    { name: 'Archivado', key: 'ARCHIVADO', valor: stats.porEstado.ARCHIVADO },
  ];
  const dataMonto = [
    { name: 'Activo', key: 'ACTIVO', valor: stats.montoPorEstado.ACTIVO },
    { name: 'Pendiente', key: 'PENDIENTE', valor: stats.montoPorEstado.PENDIENTE },
    { name: 'Archivado', key: 'ARCHIVADO', valor: stats.montoPorEstado.ARCHIVADO },
  ];
  const dataTendencia = stats.tendencia.map((t) => ({
    fecha: fechaCorta(t.fecha),
    fechaLarga: fechaCorta(t.fecha),
    total: t.total,
  }));
  const pasoX = Math.max(0, Math.floor(dataTendencia.length / 6));

  function cambiarRango(d: number) {
    setRango(d);
    dispatch(fetchStats(d));
  }

  return (
    <div className="charts-grid">
      <ChartCard titulo="Distribución por estado" delay={0.05}>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={dataEstado} dataKey="valor" nameKey="name" innerRadius={48} outerRadius={74} paddingAngle={3} stroke="none">
              {dataEstado.map((d) => (
                <Cell key={d.key} fill={COLOR[d.key as keyof typeof COLOR]} />
              ))}
            </Pie>
            <Tooltip content={<TipPersonalizado />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="chart-legend">
          {dataEstado.map((d) => (
            <span key={d.key} className="legend-item">
              <span className="legend-dot" style={{ background: COLOR[d.key as keyof typeof COLOR] }} />
              {d.name} <strong>{d.valor}</strong>
            </span>
          ))}
        </div>
      </ChartCard>

      <ChartCard titulo="Monto por estado" delay={0.12}>
        <ResponsiveContainer width="100%" height={230}>
          <BarChart data={dataMonto} margin={{ top: 24, right: 16, left: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: '#9aa6bd', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={formatoMoneda} tick={{ fill: '#5d6982', fontSize: 11 }} axisLine={false} tickLine={false} width={50} />
            <Tooltip content={<TipPersonalizado tipoMoneda />} cursor={{ fill: 'rgba(59,130,246,0.08)' }} />
            <Bar dataKey="valor" radius={[6, 6, 0, 0]}>
              {dataMonto.map((d) => (
                <Cell key={d.key} fill={COLOR[d.key as keyof typeof COLOR]} />
              ))}
              <LabelList dataKey="valor" position="top" formatter={(v: any) => formatoMoneda(Number(v))} fill="#e8edf8" fontSize={11} fontWeight={600} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        titulo="Tendencia de registros"
        delay={0.19}
        extra={
          <div className="range-switch">
            {[30, 60, 120].map((d) => (
              <button
                key={d}
                className={`range-btn ${rango === d ? 'range-btn-active' : ''}`}
                onClick={() => cambiarRango(d)}
              >
                {d}d
              </button>
            ))}
          </div>
        }
      >
        <ResponsiveContainer width="100%" height={230}>
          <AreaChart data={dataTendencia} margin={{ top: 10, right: 18, left: 0, bottom: 4 }}>
            <defs>
              <linearGradient id="gradArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="fecha" tick={{ fill: '#5d6982', fontSize: 10 }} axisLine={false} tickLine={false} interval={pasoX} />
            <YAxis tick={{ fill: '#5d6982', fontSize: 11 }} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
            <Tooltip content={<TipTendencia />} cursor={{ stroke: 'rgba(59,130,246,0.3)' }} />
            <Area type="monotone" dataKey="total" stroke="#60a5fa" strokeWidth={2.5} fill="url(#gradArea)" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard titulo="Conteo por estado" delay={0.26}>
        <ResponsiveContainer width="100%" height={230}>
          <BarChart data={dataEstado} layout="vertical" margin={{ top: 4, right: 40, left: 14, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
            <XAxis type="number" tick={{ fill: '#5d6982', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <YAxis type="category" dataKey="name" tick={{ fill: '#9aa6bd', fontSize: 11 }} axisLine={false} tickLine={false} width={74} />
            <Tooltip content={<TipPersonalizado />} cursor={{ fill: 'rgba(59,130,246,0.08)' }} />
            <Bar dataKey="valor" radius={[0, 6, 6, 0]}>
              {dataEstado.map((d) => (
                <Cell key={d.key} fill={COLOR[d.key as keyof typeof COLOR]} />
              ))}
              <LabelList dataKey="valor" position="right" fill="#e8edf8" fontSize={11} fontWeight={600} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
