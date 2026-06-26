/**
 * App — Definición del enrutado dinámico con react-router-dom v6.
 *
 * Rutas:
 *   /login                 -> pantalla de acceso (pública)
 *   /:tenant/dashboard     -> vista protegida; el segmento :tenant es dinámico
 *   *                      -> redirige a /login
 *
 * El segmento :tenant hace que la URL refleje el tenant activo
 * (ej: /tenant-a/dashboard), tal como pide la prueba.
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/:tenant/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
