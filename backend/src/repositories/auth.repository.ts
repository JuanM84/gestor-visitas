import { pool } from '../config/db';

export const AuthRepository = {
    async buscarUsuarioPorEmail(email: string) {
        const result = await pool.query(
            'SELECT id, nombre, email, password_hash, rol, activo FROM Usuario WHERE email = $1',
            [email]
        );
        return result.rows[0];
    }
};