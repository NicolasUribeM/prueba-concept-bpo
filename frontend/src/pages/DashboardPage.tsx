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
 *
 * Extras de UX: columnas redimensionables (arrastrar la cabecera) y animaciones
 * suaves al ordenar y paginar.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
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
import { LoadingScreen } from '../components/LoadingScreen';
import { useToast } from '../components/Toast';

const POR_PAGINA = 20;

// Columnas: orden lógico ID · Título · Estado · Fecha · Monto.
// 'sort' es el campo que entiende el backend; 'w' el ancho inicial en px.
const COLUMNAS = [
  { campo: 'reference', etiqueta: 'ID', sort: 'id', w: 130 },
  { campo: 'title', etiqueta: 'Título', sort: 'title', w: 300 },
  { campo: 'status', etiqueta: 'Estado', sort: 'status', w: 130 },
  { campo: 'created_at', etiqueta: 'Fecha', sort: 'created_at', w: 150 },
  { campo: 'amount', etiqueta: 'Monto', sort: 'amount', w: 150 },
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
  const [anchos, setAnchos] = useState<number[]>(COLUMNAS.map((c) => c.w));
  const colRefs = useRef<(HTMLTableColElement | null)[]>([]);
  const [primerRecordsListo, setPrimerRecordsListo] = useState(false);

  const busquedaDebounced = useDebounce(busqueda, 350);
  const esAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    setPagina(0);
  }, [busquedaDebounced]);

  useEffect(() => {
    dispatch(
      fetchRecords({
        search: busquedaDebounced.trim(),
        sortBy,
        sortDir,
        limit: POR_PAGINA,
        offset: pagina * POR_PAGINA,
      })
    ).then(() => setPrimerRecordsListo(true)); // marca el fin de la 1ª carga
  }, [dispatch, busquedaDebounced, sortBy, sortDir, pagina]);

  useEffect(() => {
    dispatch(fetchStats(30));
  }, [dispatch]);

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

  // Redimensionado de columnas: arrastrar el borde derecho de la cabecera.
  // Durante el arrastre actualizamos el ancho DIRECTAMENTE en el DOM (sin
  // re-render de React en cada pixel) para que sea totalmente fluido; el valor
  // final se "confirma" al soltar.
  function iniciarResize(e: React.MouseEvent, idx: number) {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startW = colRefs.current[idx]?.offsetWidth ?? anchos[idx];
    let ultimo = startW;
    function mover(ev: MouseEvent) {
      ultimo = Math.max(80, startW + (ev.clientX - startX));
      const col = colRefs.current[idx];
      if (col) col.style.width = `${ultimo}px`;
    }
    function soltar() {
      window.removeEventListener('mousemove', mover);
      window.removeEventListener('mouseup', soltar);
      document.body.style.cursor = '';
      setAnchos((prev) => {
        const copia = [...prev];
        copia[idx] = ultimo;
        return copia;
      });
    }
    window.addEventListener('mousemove', mover);
    window.addEventListener('mouseup', soltar);
    document.body.style.cursor = 'col-resize';
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
    dispatch(fetchStats(30));
  }

  function handleLogout() {
    dispatch(logout()); // reset total del store (anti data-bleeding)
    toast.info('Sesión cerrada');
    navigate('/login');
  }

  // Pantalla de carga intermedia: se muestra hasta que la PRIMERA carga de
  // registros y las métricas estén listas, para no ver el panel armándose.
  const listo = primerRecordsListo && stats !== null;

  // Distingue la carga inicial (muestra skeletons) de un refetch por
  // orden/paginación/búsqueda (mantiene los datos y solo muestra el spinner).
  const cargaInicial = loading && items.length === 0;
  const refrescando = loading && items.length > 0;

  if (!listo) {
    return <LoadingScreen tenantName={tenantName} />;
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

        <div className={`table-wrap ${refrescando ? 'is-refetching' : ''}`}>
          {/* Indicador de recarga suave: no quita los datos actuales, solo los
              atenúa y muestra una "bolita" mientras llega la nueva consulta. */}
          {refrescando && (
            <div className="table-spinner">
              <span className="spinner" />
            </div>
          )}
          <table className="records-table">
            <colgroup>
              {COLUMNAS.map((c, i) => (
                <col
                  key={c.campo}
                  ref={(el) => {
                    colRefs.current[i] = el;
                  }}
                  style={{ width: anchos[i] }}
                />
              ))}
            </colgroup>
            <thead>
              <tr>
                {COLUMNAS.map((c, i) => (
                  <th
                    key={c.campo}
                    className="sortable"
                    onClick={() => ordenarPor(c.sort)}
                  >
                    <span className="th-label">
                      {c.etiqueta}
                      <span className="sort-arrow">
                        {sortBy === c.sort ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
                      </span>
                    </span>
                    {i < COLUMNAS.length - 1 && (
                      <span
                        className="col-resizer"
                        onMouseDown={(e) => iniciarResize(e, i)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cargaInicial
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
          <motion.button
            className="btn btn-ghost btn-sm"
            whileTap={{ scale: 0.94 }}
            disabled={pagina === 0}
            onClick={() => setPagina((p) => Math.max(0, p - 1))}
          >
            ← Anterior
          </motion.button>
          <span className="page-info">
            Página <strong>{pagina + 1}</strong> de {totalPaginas}
          </span>
          <motion.button
            className="btn btn-ghost btn-sm"
            whileTap={{ scale: 0.94 }}
            disabled={pagina + 1 >= totalPaginas}
            onClick={() => setPagina((p) => Math.min(totalPaginas - 1, p + 1))}
          >
            Siguiente →
          </motion.button>
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
