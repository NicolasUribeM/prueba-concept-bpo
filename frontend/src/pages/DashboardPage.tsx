/**
 * DashboardPage — Vista principal del tenant: métricas + tabla de registros.
 * -----------------------------------------------------------------------------
 * Optimización de render (criterio de la prueba):
 *   - useDebounce: la búsqueda no filtra en cada tecla, solo al pausar.
 *   - useMemo: el filtrado solo se recalcula al cambiar datos o término.
 *   - React.memo (RecordRow): las filas no se re-renderizan sin necesidad.
 *
 * Valor agregado: tarjetas de métricas, modal de creación (ADMIN), skeletons
 * de carga, toasts y micro-animaciones (Framer Motion).
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { logout } from '../store/authSlice';
import { fetchRecords, fetchStats } from '../store/recordsSlice';
import { useDebounce } from '../hooks/useDebounce';
import { RecordRow } from '../components/RecordRow';
import { MetricCards } from '../components/MetricCards';
import { CreateRecordModal } from '../components/CreateRecordModal';
import { SkeletonRow } from '../components/Skeleton';
import { useToast } from '../components/Toast';

export function DashboardPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const toast = useToast();
  const { tenantName, tenantSlug, user } = useAppSelector((s) => s.auth);
  const { items, total, loading, stats } = useAppSelector((s) => s.records);

  const [busqueda, setBusqueda] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const busquedaDebounced = useDebounce(busqueda, 300);

  const esAdmin = user?.role === 'ADMIN';

  // Cargamos página de registros + métricas al montar.
  useEffect(() => {
    dispatch(fetchRecords({ limit: 100, offset: 0 }));
    dispatch(fetchStats());
  }, [dispatch]);

  // useMemo: filtrado costoso que solo se recalcula al cambiar datos o término.
  const registrosFiltrados = useMemo(() => {
    const termino = busquedaDebounced.trim().toLowerCase();
    if (!termino) return items;
    return items.filter(
      (r) =>
        r.title.toLowerCase().includes(termino) ||
        r.status.toLowerCase().includes(termino)
    );
  }, [items, busquedaDebounced]);

  function handleLogout() {
    dispatch(logout()); // reset total del store (anti data-bleeding)
    toast.info('Sesión cerrada');
    navigate('/login');
  }

  return (
    <motion.div
      className="dashboard"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
    >
      {/* ---- Topbar ---- */}
      <header className="topbar glass">
        <div className="topbar-left">
          <div className="topbar-mark">{tenantName?.charAt(0) ?? '·'}</div>
          <div>
            <h2>{tenantName}</h2>
            <span className="tenant-badge">tenant: {tenantSlug}</span>
          </div>
        </div>
        <div className="topbar-right">
          <div className="user-chip">
            <span className="user-email">{user?.email}</span>
            <span className={`badge badge-${esAdmin ? 'pendiente' : 'archivado'}`}>
              {user?.role}
            </span>
          </div>
          <button onClick={handleLogout} className="btn btn-danger btn-sm">
            Cerrar sesión
          </button>
        </div>
      </header>

      {/* ---- Métricas ---- */}
      <MetricCards stats={stats} />

      {/* ---- Tabla ---- */}
      <section className="glass panel">
        <div className="panel-head">
          <div className="toolbar">
            <span className="search-icon">⌕</span>
            <input
              className="field search-field"
              placeholder="Buscar por título o estado…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <div className="panel-actions">
            <span className="counter">
              {registrosFiltrados.length} de {total} registros
            </span>
            {esAdmin && (
              <button className="btn btn-sm" onClick={() => setModalAbierto(true)}>
                + Nuevo registro
              </button>
            )}
          </div>
        </div>

        <div className="table-wrap">
          <table className="records-table">
            <thead>
              <tr>
                <th className="col-id">ID</th>
                <th>Título</th>
                <th>Estado</th>
                <th>Monto</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                : registrosFiltrados.map((r) => (
                    <RecordRow key={r.id} record={r} />
                  ))}
            </tbody>
          </table>

          {!loading && registrosFiltrados.length === 0 && (
            <p className="empty-state">Sin resultados para “{busqueda}”.</p>
          )}
        </div>
      </section>

      {/* ---- Modal de creación (solo ADMIN) ---- */}
      <CreateRecordModal
        abierto={modalAbierto}
        onCerrar={() => setModalAbierto(false)}
      />
    </motion.div>
  );
}
