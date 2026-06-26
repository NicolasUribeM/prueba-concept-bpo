/**
 * recordsSlice — Estado de los registros de negocio del tenant activo.
 * Se mantiene en Redux para demostrar el reset anti data-bleeding: al cambiar
 * de tenant / cerrar sesión, estos datos se eliminan junto con el resto del
 * estado global.
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../api/axios';

export interface Record {
  id: number;
  tenant_id: number;
  title: string;
  description: string | null;
  status: 'ACTIVO' | 'PENDIENTE' | 'ARCHIVADO';
  amount: number;
  created_at: string;
}

export interface Estadisticas {
  total: number;
  montoTotal: number;
  porEstado: { ACTIVO: number; PENDIENTE: number; ARCHIVADO: number };
}

interface RecordsState {
  items: Record[];
  total: number;
  loading: boolean;
  error: string | null;
  stats: Estadisticas | null;
  creando: boolean;
}

const estadoInicial: RecordsState = {
  items: [],
  total: 0,
  loading: false,
  error: null,
  stats: null,
  creando: false,
};

/**
 * Trae records del backend. NO enviamos tenant: el interceptor inyecta la
 * cabecera X-Tenant-ID desde el estado y el backend filtra por ese tenant.
 */
export const fetchRecords = createAsyncThunk(
  'records/fetch',
  async (args: { limit: number; offset: number }, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/records', {
        params: { limit: args.limit, offset: args.offset },
      });
      return data as { data: Record[]; pagination: { total: number } };
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.error ?? 'No se pudieron cargar los registros.'
      );
    }
  }
);

/** Trae las estadísticas agregadas del tenant para las tarjetas de métricas. */
export const fetchStats = createAsyncThunk(
  'records/stats',
  async (_: void, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/records/stats');
      return data as Estadisticas;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error ?? 'Error al cargar métricas.');
    }
  }
);

/** Crea un nuevo record (solo ADMIN). El tenant lo impone el backend. */
export const crearRecord = createAsyncThunk(
  'records/crear',
  async (
    datos: { title: string; description?: string; status?: string; amount?: number },
    { rejectWithValue }
  ) => {
    try {
      const { data } = await api.post('/records', datos);
      return data as Record;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error ?? 'No se pudo crear el registro.');
    }
  }
);

const recordsSlice = createSlice({
  name: 'records',
  initialState: estadoInicial,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRecords.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRecords.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data;
        state.total = action.payload.pagination.total;
      })
      .addCase(fetchRecords.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // --- Estadísticas ---
      .addCase(fetchStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      })
      // --- Creación de record ---
      .addCase(crearRecord.pending, (state) => {
        state.creando = true;
      })
      .addCase(crearRecord.fulfilled, (state, action) => {
        state.creando = false;
        // Insertamos al inicio de la lista visible para feedback inmediato.
        state.items.unshift(action.payload);
        state.total += 1;
      })
      .addCase(crearRecord.rejected, (state) => {
        state.creando = false;
      });
  },
});

export default recordsSlice.reducer;
