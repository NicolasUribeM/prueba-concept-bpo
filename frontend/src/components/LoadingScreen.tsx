/**
 * LoadingScreen — Pantalla intermedia de carga.
 * Se muestra tras iniciar sesión mientras se cargan los datos del panel
 * (registros + métricas), para que el usuario no vea la tabla "armándose" a
 * pedazos. Cuando todo está listo, hace una transición suave al dashboard.
 */
import { motion } from 'framer-motion';

export function LoadingScreen({ tenantName }: { tenantName?: string | null }) {
  return (
    <motion.div
      className="loading-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="loading-orbit">
        <span className="loading-ring" />
        <span className="loading-core" />
      </div>
      <motion.p
        className="loading-text"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        Preparando tu panel{tenantName ? ` · ${tenantName}` : ''}…
      </motion.p>
    </motion.div>
  );
}
