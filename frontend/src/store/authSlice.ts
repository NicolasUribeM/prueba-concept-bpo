/**
 * tenantSlice / authSlice — Estado global de sesión y tenant activo.
 * -----------------------------------------------------------------------------
 * Guarda el tenant activo, el usuario y el token JWT. El interceptor de axios
 * lee de aquí para inyectar automáticamente la cabecera X-Tenant-ID y el token.
 *
 * Mecanismo anti "data bleeding": la acción `logout` borra TODO el estado de
 * sesión. Además, en el store se resetea el árbol completo de Redux al hacer
 * logout, de modo que no queden datos residuales del tenant anterior.
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { api } from '../api/axios';

export type Rol = 'ADMIN' | 'USER';

interface AuthState {
  token: string | null;
  tenantSlug: string | null;
  tenantName: string | null;
  user: { email: string; role: Rol } | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const estadoInicial: AuthState = {
  token: null,
  tenantSlug: null,
  tenantName: null,
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

/**
 * Thunk de login. Envía credenciales al backend incluyendo el tenant elegido
 * en la cabecera X-Tenant-ID. Devuelve token + datos de usuario/tenant.
 */
export const login = createAsyncThunk(
  'auth/login',
  async (
    args: { tenantSlug: string; email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const { data } = await api.post(
        '/login',
        { email: args.email, password: args.password },
        { headers: { 'X-Tenant-ID': args.tenantSlug } }
      );
      return data as {
        token: string;
        usuario: { email: string; role: Rol };
        tenant: { slug: string; name: string };
      };
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.error ?? 'No se pudo iniciar sesión.'
      );
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: estadoInicial,
  reducers: {
    /** Cierra sesión. El reset total del store se hace en store/index.ts. */
    logout: () => estadoInicial,
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.tenantSlug = action.payload.tenant.slug;
        state.tenantName = action.payload.tenant.name;
        state.user = action.payload.usuario;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
