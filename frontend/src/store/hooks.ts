/**
 * Hooks tipados de Redux para usar en toda la app en lugar de los genéricos.
 * Evita repetir tipos (filosofía DRY) y da autocompletado del estado.
 */
import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from './index';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
