/**
 * main.tsx — Punto de entrada del frontend.
 * Conecta el Provider de Redux, el BrowserRouter, el ToastProvider y enlaza el
 * store con el interceptor de axios (setStoreRef) para inyectar cabeceras.
 * También monta el fondo aurora animado detrás de toda la app.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';

// Tipografía Inter (self-hosted) — pesos usados en la UI.
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter/800.css';

import App from './App.tsx';
import { store } from './store';
import { setStoreRef } from './api/axios';
import { AnimatedBackground } from './components/AnimatedBackground';
import { ToastProvider } from './components/Toast';
import './index.css';

// El interceptor de axios podrá leer el estado actual del store.
setStoreRef(() => store.getState());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <ToastProvider>
          <AnimatedBackground />
          <App />
        </ToastProvider>
      </BrowserRouter>
    </Provider>
  </StrictMode>
);
