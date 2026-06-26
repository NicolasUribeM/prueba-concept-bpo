/**
 * RecordRow — Una fila de la tabla, memoizada con React.memo.
 * React.memo evita re-renderizar cada fila cuando cambian props no relacionadas,
 * mejorando el rendimiento con muchas filas.
 * Orden de columnas: ID · Título · Estado · Fecha · Monto.
 */
import { memo } from 'react';
import type { Record } from '../store/recordsSlice';

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

// Formatea la fecha a "12 may 2026" de forma robusta (sin depender de locale).
function formatearFecha(iso: string) {
  const f = new Date(iso);
  if (isNaN(f.getTime())) return '—';
  return `${String(f.getDate()).padStart(2, '0')} ${MESES[f.getMonth()]} ${f.getFullYear()}`;
}

function RecordRowBase({ record }: { record: Record }) {
  return (
    <tr>
      <td className="col-id">{record.reference}</td>
      <td className="cell-title">{record.title}</td>
      <td>
        <span className={`badge badge-${record.status.toLowerCase()}`}>
          {record.status}
        </span>
      </td>
      <td className="cell-date">{formatearFecha(record.created_at)}</td>
      <td className="amount">
        ${Number(record.amount).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
      </td>
    </tr>
  );
}

export const RecordRow = memo(RecordRowBase);
