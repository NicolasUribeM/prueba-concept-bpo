/**
 * Sistema de notificaciones "toast" — glass + animaciones (Framer Motion).
 * Provee un contexto global y un hook useToast() para lanzar mensajes desde
 * cualquier componente. Centraliza el feedback al usuario (filosofía DRY).
 *
 * Uso:
 *   const toast = useToast();
 *   toast.success('Sesión iniciada');
 *   toast.error('Credenciales inválidas');
 */
import { createContext, useCallback, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

type TipoToast = 'success' | 'error' | 'info';
interface Toast {
  id: number;
  tipo: TipoToast;
  mensaje: string;
}

interface ToastAPI {
  success: (m: string) => void;
  error: (m: string) => void;
  info: (m: string) => void;
}

const ToastContext = createContext<ToastAPI | null>(null);

const iconos: Record<TipoToast, string> = {
  success: '✓',
  error: '✕',
  info: 'i',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const lanzar = useCallback((tipo: TipoToast, mensaje: string) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, tipo, mensaje }]);
    // Auto-cierre tras 3.5s.
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const api: ToastAPI = {
    success: (m) => lanzar('success', m),
    error: (m) => lanzar('error', m),
    info: (m) => lanzar('info', m),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-stack">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              className={`toast toast-${t.tipo} glass`}
              initial={{ opacity: 0, x: 60, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            >
              <span className={`toast-icon toast-icon-${t.tipo}`}>
                {iconos[t.tipo]}
              </span>
              <span>{t.mensaje}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastAPI {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>.');
  return ctx;
}
