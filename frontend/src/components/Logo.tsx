/**
 * Logo — Muestra el logo de Concept BPO.
 * Intenta cargar /logo-concept-bpo.svg (o .png) desde la carpeta public.
 * Si no existe todavía, hace un "fallback" elegante a un wordmark generado
 * (monograma + nombre), para que el login siempre se vea profesional.
 *
 * Para usar el logo real: coloca el archivo en frontend/public/ con el nombre
 * "logo-concept-bpo.svg" (o cambia la constante LOGO_SRC).
 */
import { useState } from 'react';

const LOGO_SRC = '/logo-concept-bpo.png';

export function Logo() {
  const [falló, setFalló] = useState(false);

  if (!falló) {
    return (
      <img
        src={LOGO_SRC}
        alt="Concept BPO"
        className="brand-logo"
        onError={() => setFalló(true)}
      />
    );
  }

  // Fallback: monograma glass + wordmark.
  return (
    <div className="brand-fallback" title="Reemplaza public/logo-concept-bpo.svg">
      <div className="brand-mark">CB</div>
      <div className="brand-text">
        <span className="brand-name">Concept BPO</span>
        <span className="brand-sub">Multi-Tenant Platform</span>
      </div>
    </div>
  );
}
