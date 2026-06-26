/**
 * LoginPage — Pantalla de inicio de sesión.
 * El usuario elige el tenant (esto determina el segmento /:tenant de la URL)
 * e introduce sus credenciales. Tras autenticar, se redirige a
 * /:tenant/dashboard.
 */
import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { login } from '../store/authSlice';

export function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error } = useAppSelector((s) => s.auth);

  // Valores precargados para facilitar la prueba (datos dummy de la BD).
  const [tenantSlug, setTenantSlug] = useState('tenant-a');
  const [email, setEmail] = useState('admin@alfa.com');
  const [password, setPassword] = useState('password123');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const resultado = await dispatch(login({ tenantSlug, email, password }));
    // Si el login fue exitoso, navegamos al dashboard del tenant.
    if (login.fulfilled.match(resultado)) {
      navigate(`/${resultado.payload.tenant.slug}/dashboard`);
    }
  }

  return (
    <div className="login-container">
      <form className="card login-card" onSubmit={handleSubmit}>
        <h1>Acceso Multi-Tenant</h1>
        <p className="subtitle">Prueba técnica · Concept BPO</p>

        <label>Tenant (empresa)</label>
        <select value={tenantSlug} onChange={(e) => setTenantSlug(e.target.value)}>
          <option value="tenant-a">Empresa Alfa S.A. (tenant-a)</option>
          <option value="tenant-b">Comercial Beta Ltda. (tenant-b)</option>
        </select>

        <label>Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />

        <label>Contraseña</label>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
        />

        {error && <p className="error">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>

        <p className="hint">
          Prueba: admin@alfa.com / user@alfa.com / admin@beta.com · clave:
          password123
        </p>
      </form>
    </div>
  );
}
