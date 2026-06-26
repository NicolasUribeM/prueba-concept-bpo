/**
 * main.tsx — Punto de entrada del frontend.
 * Conecta el Provider de Redux, el BrowserRouter y enlaza el store con el
 * interceptor de axios (setStoreRef) para inyectar cabeceras automáticamente.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import { store } from './store';
import { setStoreRef } from './api/axios';
import './index.css';

// El interceptor de axios podrá leer el estado actual del store.
setStoreRef(() => store.getState());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </StrictMode>
);
