/**
 * DashboardPage — Vista principal del tenant: métricas + gráficos + tabla.
 * -----------------------------------------------------------------------------
 * Búsqueda, orden y paginación son SERVER-SIDE (el backend filtra por tenant),
 * lo que mantiene el aislamiento y escala a grandes volúmenes.
 *
 * Optimización de render (criterio de la prueba):
 *   - useDebounce: la búsqueda no dispara una petición en cada tecla.
 *   - useMemo: cálculos derivados (páginas) no se rehacen en cada render.
 *   - React.memo (RecordRow): las filas no se re-renderizan sin necesidad.
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
import { Charts } from '../components/Charts';
import { CreateRecordModal } from '../components/CreateRecordModal';
import { SkeletonRow } from '../components/Skeleton';
import { useToast } from '../components/Toast';

const POR_PAGINA = 20;

// Columnas ordenables: clave de UI -> campo que entiende el backend.
const COLUMNAS = [
  { campo: 'reference', etiqueta: 'ID', sort: 'id' },
  { campo: 'title', etiqueta: 'Título', sort: 'title' },
  { campo: 'status', etiqueta: 'Estado', sort: 'status' },
  { campo: 'amount', etiqueta: 'Monto', sort: 'amount' },
];

export function DashboardPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const toast = useToast();
  const { tenantName, tenantSlug, user } = useAppSelector((s) => s.auth);
  const { items, total, loading, stats } = useAppSelector((s) => s.records);

  const [busqueda, setBusqueda] = useState('');
  const [sortBy, setSortBy] = useState('id');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [pagina, setPagina] = useState(0);
  const [modalAbierto, setModalAbierto] = useState(false);

  const busquedaDebounced = useDebounce(busqueda, 350);
  const esAdmin = user?.role === 'ADMIN';

  // Al cambiar la búsqueda, volvemos a la primera página.
  useEffect(() => {
    setPagina(0);
  }, [busquedaDebounced]);

  // Carga de registros cuando cambian búsqueda, orden o página (server-side).
  useEffect(() => {
    dispatch(
      fetchRecords({
        search: busquedaDebounced.trim(),
        sortBy,
        sortDir,
        limit: POR_PAGINA,
        offset: pagina * POR_PAGINA,
      })
    );
  }, [dispatch, busquedaDebounced, sortBy, sortDir, pagina]);

  // Métricas/gráficos al montar.
  useEffect(() => {
    dispatch(fetchStats());
  }, [dispatch]);

  // useMemo: cálculo de paginación derivado del total.
  const totalPaginas = useMemo(
    () => Math.max(1, Math.ceil(total / POR_PAGINA)),
    [total]
  );

  function ordenarPor(sort: string) {
    if (sortBy === sort) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(sort);
      setSortDir('asc');
    }
    setPagina(0);
  }

  function recargar() {
    dispatch(
      fetchRecords({
        search: busquedaDebounced.trim(),
        sortBy,
        sortDir,
        limit: POR_PAGINA,
        offset: pagina * POR_PAGINA,
      })
    );
    dispatch(fetchStats());
  }

  function handleLogout() {
    dispatch(logout()); // reset total del store (anti data-bleeding)
    toast.info('Sesión cerrada');
    navigate('/login');
  }

  return (
    <motion.div
      className="dashboard"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 0.61, 0.36, 1] }}
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

      {/* ---- Gráficos ---- */}
      <Charts stats={stats} />

      {/* ---- Tabla ---- */}
      <section className="glass panel">
        <div className="panel-head">
          <div className="toolbar">
            <span className="search-icon">⌕</span>
            <input
              className="field search-field"
              placeholder="Buscar por ID, título o estado…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <div className="panel-actions">
            <span className="counter">{total} registros</span>
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
                {COLUMNAS.map((c) => (
                  <th
                    key={c.campo}
                    className={`sortable ${c.campo === 'reference' ? 'col-id' : ''}`}
                    onClick={() => ordenarPor(c.sort)}
                  >
                    {c.etiqueta}
                    <span className="sort-arrow">
                      {sortBy === c.sort ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                : items.map((r) => <RecordRow key={r.id} record={r} />)}
            </tbody>
          </table>

          {!loading && items.length === 0 && (
            <p className="empty-state">Sin resultados para “{busqueda}”.</p>
          )}
        </div>

        {/* ---- Paginación ---- */}
        <div className="pagination">
          <button
            className="btn btn-ghost btn-sm"
            disabled={pagina === 0}
            onClick={() => setPagina((p) => Math.max(0, p - 1))}
          >
            ← Anterior
          </button>
          <span className="page-info">
            Página <strong>{pagina + 1}</strong> de {totalPaginas}
          </span>
          <button
            className="btn btn-ghost btn-sm"
            disabled={pagina + 1 >= totalPaginas}
            onClick={() => setPagina((p) => Math.min(totalPaginas - 1, p + 1))}
          >
            Siguiente →
          </button>
        </div>
      </section>

      {/* ---- Modal de creación (solo ADMIN) ---- */}
      <CreateRecordModal
        abierto={modalAbierto}
        onCerrar={() => setModalAbierto(false)}
        onCreado={recargar}
      />
    </motion.div>
  );
}
