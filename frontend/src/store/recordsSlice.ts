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

interface RecordsState {
  items: Record[];
  total: number;
  loading: boolean;
  error: string | null;
}

const estadoInicial: RecordsState = {
  items: [],
  total: 0,
  loading: false,
  error: null,
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
      });
  },
});

export default recordsSlice.reducer;
