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
import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Lenis from 'lenis';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  // Scroll suave con inercia (Lenis) para toda la página. Los contenedores con
  // data-lenis-prevent (tabla, modal) usan su propio scroll nativo.
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, []);

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
