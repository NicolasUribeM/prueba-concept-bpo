/**
 * RecordRow — Una fila de la tabla, memoizada con React.memo.
 * React.memo evita re-renderizar cada fila cuando cambian props no relacionadas,
 * mejorando el rendimiento con muchas filas.
 */
import { memo } from 'react';
import type { Record } from '../store/recordsSlice';

function RecordRowBase({ record }: { record: Record }) {
  return (
    <tr>
      <td className="col-id">{record.reference}</td>
      <td>{record.title}</td>
      <td>
        <span className={`badge badge-${record.status.toLowerCase()}`}>
          {record.status}
        </span>
      </td>
      <td className="amount">
        ${Number(record.amount).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
      </td>
    </tr>
  );
}

export const RecordRow = memo(RecordRowBase);
