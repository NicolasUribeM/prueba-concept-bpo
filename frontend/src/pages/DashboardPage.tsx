/**
 * DashboardPage — Vista principal del tenant: tabla de registros.
 * -----------------------------------------------------------------------------
 * Demuestra las técnicas de optimización de render exigidas:
 *   - useDebounce: la búsqueda no filtra en cada tecla, solo al pausar.
 *   - useMemo: el filtrado sobre el array solo se recalcula cuando cambian
 *     los datos o el término de búsqueda (no en cada render).
 *   - React.memo (en RecordRow): las filas no se re-renderizan sin necesidad.
 */
import { useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { logout } from '../store/authSlice';
import { fetchRecords } from '../store/recordsSlice';
import { useDebounce } from '../hooks/useDebounce';
import { RecordRow } from '../components/RecordRow';
import { useNavigate } from 'react-router-dom';

export function DashboardPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { tenantName, tenantSlug, user } = useAppSelector((s) => s.auth);
  const { items, total, loading } = useAppSelector((s) => s.records);

  const [busqueda, setBusqueda] = useState('');
  const busquedaDebounced = useDebounce(busqueda, 300);

  // Paginación servidor: pedimos una página grande para mostrar el filtrado en
  // cliente sobre un volumen alto y lucir las optimizaciones.
  useEffect(() => {
    dispatch(fetchRecords({ limit: 100, offset: 0 }));
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
    // Dispara el reset total del store (anti data-bleeding) y vuelve al login.
    dispatch(logout());
    navigate('/login');
  }

  return (
    <div className="dashboard">
      <header className="topbar">
        <div>
          <h2>{tenantName}</h2>
          <span className="tenant-badge">tenant: {tenantSlug}</span>
        </div>
        <div className="user-box">
          <span>
            {user?.email} · <strong>{user?.role}</strong>
          </span>
          <button onClick={handleLogout} className="btn-logout">
            Cerrar sesión
          </button>
        </div>
      </header>

      <section className="card">
        <div className="toolbar">
          <input
            placeholder="Buscar por título o estado..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <span className="counter">
            Mostrando {registrosFiltrados.length} de {total} registros del tenant
          </span>
        </div>

        {loading ? (
          <p>Cargando registros...</p>
        ) : (
          <table className="records-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Título</th>
                <th>Estado</th>
                <th>Monto</th>
              </tr>
            </thead>
            <tbody>
              {registrosFiltrados.map((r) => (
                <RecordRow key={r.id} record={r} />
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
