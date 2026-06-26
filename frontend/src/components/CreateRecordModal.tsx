/**
 * CreateRecordModal — Modal glass para crear un nuevo registro (solo ADMIN).
 * Usa el endpoint POST /records existente. El tenant lo impone el backend, así
 * que aquí solo enviamos los datos del formulario. Animado con Framer Motion.
 */
import { useState } from 'react';
import type { FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { crearRecord, fetchStats } from '../store/recordsSlice';
import { useToast } from './Toast';

interface Props {
  abierto: boolean;
  onCerrar: () => void;
}

export function CreateRecordModal({ abierto, onCerrar }: Props) {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const creando = useAppSelector((s) => s.records.creando);

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState('ACTIVO');
  const [description, setDescription] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('El título es obligatorio.');
      return;
    }
    const res = await dispatch(
      crearRecord({
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        amount: amount ? Number(amount) : 0,
      })
    );
    if (crearRecord.fulfilled.match(res)) {
      toast.success('Registro creado correctamente.');
      dispatch(fetchStats()); // refrescamos métricas
      setTitle('');
      setAmount('');
      setDescription('');
      setStatus('ACTIVO');
      onCerrar();
    } else {
      toast.error((res.payload as string) ?? 'No se pudo crear el registro.');
    }
  }

  return (
    <AnimatePresence>
      {abierto && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCerrar}
        >
          <motion.div
            className="glass modal-card"
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-head">
              <h3>Nuevo registro</h3>
              <button className="modal-close" onClick={onCerrar} aria-label="Cerrar">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label className="label">Título *</label>
                <input
                  className="field"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Contrato de servicio"
                  autoFocus
                />
              </div>

              <div className="modal-row">
                <div className="form-group">
                  <label className="label">Monto</label>
                  <input
                    className="field"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="form-group">
                  <label className="label">Estado</label>
                  <select
                    className="field"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="ACTIVO">Activo</option>
                    <option value="PENDIENTE">Pendiente</option>
                    <option value="ARCHIVADO">Archivado</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="label">Descripción</label>
                <textarea
                  className="field"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalle opcional del registro…"
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={onCerrar}>
                  Cancelar
                </button>
                <button type="submit" className="btn" disabled={creando}>
                  {creando ? 'Creando…' : 'Crear registro'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
