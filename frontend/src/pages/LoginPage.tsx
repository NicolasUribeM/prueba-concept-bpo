/**
 * LoginPage — Pantalla de acceso rediseñada (glass + aurora + iOS).
 * El usuario elige el tenant (define el segmento /:tenant de la URL) e
 * introduce sus credenciales. Las credenciales de prueba se muestran en un
 * acordeón animado y son clickeables para autocompletar el formulario.
 */
import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { login } from '../store/authSlice';
import { useToast } from '../components/Toast';
import { Logo } from '../components/Logo';

// Credenciales dummy para la demo (clickeables para autocompletar).
const CREDENCIALES = [
  { tenant: 'tenant-a', empresa: 'Empresa Alfa S.A.', email: 'admin@alfa.com', rol: 'ADMIN' },
  { tenant: 'tenant-a', empresa: 'Empresa Alfa S.A.', email: 'user@alfa.com', rol: 'USER' },
  { tenant: 'tenant-b', empresa: 'Comercial Beta Ltda.', email: 'admin@beta.com', rol: 'ADMIN' },
  { tenant: 'tenant-b', empresa: 'Comercial Beta Ltda.', email: 'user@beta.com', rol: 'USER' },
];

export function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const toast = useToast();
  const { loading, error } = useAppSelector((s) => s.auth);

  const [tenantSlug, setTenantSlug] = useState('tenant-a');
  const [email, setEmail] = useState('admin@alfa.com');
  const [password, setPassword] = useState('password123');
  const [verCredenciales, setVerCredenciales] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const resultado = await dispatch(login({ tenantSlug, email, password }));
    if (login.fulfilled.match(resultado)) {
      toast.success(`Bienvenido · ${resultado.payload.tenant.name}`);
      navigate(`/${resultado.payload.tenant.slug}/dashboard`);
    }
    // En caso de error NO usamos toast: se muestra una alerta inline debajo del
    // botón (state.auth.error), que es el patrón habitual de un formulario de login.
  }

  function autocompletar(c: (typeof CREDENCIALES)[number]) {
    setTenantSlug(c.tenant);
    setEmail(c.email);
    setPassword('password123');
    toast.info(`Credenciales cargadas: ${c.email}`);
  }

  return (
    <div className="login-screen">
      {/* Logo institucional FUERA de la tarjeta (membrete) */}
      <motion.div
        className="login-brand"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 0.61, 0.36, 1] }}
      >
        <Logo />
      </motion.div>

      <motion.div
        className="glass login-card"
        initial={{ opacity: 0, y: 28, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 140, damping: 24, delay: 0.1 }}
      >
        <div className="login-head">
          <h1>Acceso a la plataforma</h1>
          <p className="login-sub">Arquitectura Multi-Tenant segura</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="label">Empresa (tenant)</label>
            <select
              className="field"
              value={tenantSlug}
              onChange={(e) => setTenantSlug(e.target.value)}
            >
              <option value="tenant-a">Empresa Alfa S.A. · tenant-a</option>
              <option value="tenant-b">Comercial Beta Ltda. · tenant-b</option>
            </select>
          </div>

          <div className="form-group">
            <label className="label">Correo electrónico</label>
            <input
              className="field"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@empresa.com"
            />
          </div>

          <div className="form-group">
            <label className="label">Contraseña</label>
            <input
              className="field"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button className="btn login-btn" type="submit" disabled={loading}>
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>

          {/* Alerta inline debajo del botón (patrón clásico de login) */}
          <AnimatePresence>
            {error && (
              <motion.p
                className="login-error"
                initial={{ opacity: 0, y: -6, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -6, height: 0 }}
                transition={{ duration: 0.25 }}
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>
        </form>

        {/* Acordeón de credenciales de prueba */}
        <div className="cred-accordion">
          <button
            type="button"
            className="cred-toggle"
            onClick={() => setVerCredenciales((v) => !v)}
            aria-expanded={verCredenciales}
          >
            <span>¿Credenciales de prueba?</span>
            <motion.span
              animate={{ rotate: verCredenciales ? 180 : 0 }}
              transition={{ duration: 0.25 }}
              className="cred-chevron"
            >
              ⌄
            </motion.span>
          </button>

          <AnimatePresence initial={false}>
            {verCredenciales && (
              <motion.div
                key="cred-body"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
                className="cred-body"
              >
                <p className="cred-hint">
                  Clave para todos: <code>password123</code> · haz clic para
                  autocompletar
                </p>
                <div className="cred-list">
                  {CREDENCIALES.map((c) => (
                    <button
                      key={c.email}
                      type="button"
                      className="cred-item"
                      onClick={() => autocompletar(c)}
                    >
                      <span className="cred-email">{c.email}</span>
                      <span className="cred-meta">
                        <span className="cred-tenant">{c.tenant}</span>
                        <span className={`badge badge-${c.rol === 'ADMIN' ? 'pendiente' : 'archivado'}`}>
                          {c.rol}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <p className="login-credit">
        Desarrollado por <strong>Nicolás Uribe</strong> · Prueba técnica Concept BPO
      </p>
    </div>
  );
}
