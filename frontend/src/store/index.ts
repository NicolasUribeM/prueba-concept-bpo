/**
 * Configuración del store de Redux Toolkit.
 *
 * Reset anti "data bleeding": envolvemos el rootReducer de modo que, al
 * despachar la acción 'auth/logout', el estado global se reinicia por completo
 * (state = undefined). Así NINGÚN slice conserva datos del tenant anterior.
 */
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import type { Action } from '@reduxjs/toolkit';
import authReducer, { logout } from './authSlice';
import recordsReducer from './recordsSlice';

const appReducer = combineReducers({
  auth: authReducer,
  records: recordsReducer,
});

type RootReducerState = ReturnType<typeof appReducer>;

const rootReducer = (
  state: RootReducerState | undefined,
  action: Action
): RootReducerState => {
  // Al cerrar sesión limpiamos TODO el árbol de estado.
  if (action.type === logout.type) {
    state = undefined;
  }
  return appReducer(state, action);
};

export const store = configureStore({
  reducer: rootReducer,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
