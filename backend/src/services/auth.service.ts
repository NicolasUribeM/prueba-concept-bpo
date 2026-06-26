/**
 * Servicio de Autenticación: valida credenciales y emite el JWT.
 *
 * El login está SIEMPRE acotado a un tenant: se busca al usuario por
 * (tenant_id, email). El token resultante queda atado a ese tenant, lo que
 * sustenta el aislamiento que verifica checkAuth.
 */
import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { RowDataPacket } from 'mysql2';
import { pool } from '../db/pool';
import { env } from '../config/env';
import { Rol, UsuarioAutenticado } from '../types';

interface FilaUsuario extends RowDataPacket {
  id: number;
  tenant_id: number;
  email: string;
  password_hash: string;
  role: Rol;
}

export const authService = {
  /**
   * Valida email + contraseña dentro de un tenant concreto y devuelve un JWT.
   * Devuelve null si las credenciales no son válidas.
   */
  async login(
    tenantId: number,
    email: string,
    password: string
  ): Promise<{ token: string; usuario: UsuarioAutenticado } | null> {
    const [filas] = await pool.query<FilaUsuario[]>(
      'SELECT id, tenant_id, email, password_hash, role FROM users WHERE tenant_id = ? AND email = ? LIMIT 1',
      [tenantId, email]
    );

    if (filas.length === 0) return null;

    const usuarioDb = filas[0];

    // Comparación segura de la contraseña contra el hash bcrypt almacenado.
    const passwordValida = await bcrypt.compare(password, usuarioDb.password_hash);
    if (!passwordValida) return null;

    // Payload que viajará firmado dentro del JWT.
    const payload: UsuarioAutenticado = {
      userId: usuarioDb.id,
      tenantId: usuarioDb.tenant_id,
      email: usuarioDb.email,
      role: usuarioDb.role,
    };

    const token = jwt.sign(payload, env.jwt.secret, {
      expiresIn: env.jwt.expiresIn,
    } as SignOptions);

    return { token, usuario: payload };
  },
};
