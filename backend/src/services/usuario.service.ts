import { pool } from '../config/db';
import bcrypt from 'bcrypt';

export const UsuarioService = {
    async obtenerTodos() {
        const query = `
            SELECT id, nombre, email, rol, activo 
            FROM Usuario 
            ORDER BY nombre ASC
        `;
        const result = await pool.query(query);
        return result.rows;
    },

    async crearUsuario(datos: any) {
        const existe = await pool.query('SELECT id FROM Usuario WHERE email = $1', [datos.email]);
        if (existe.rows.length > 0) {
            throw new Error('El correo electrónico ya está registrado.');
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(datos.password, salt);

        const query = `
            INSERT INTO Usuario (nombre, email, password_hash, rol) 
            VALUES ($1, $2, $3, $4) 
            RETURNING id, nombre, email, rol, activo
        `;
        const result = await pool.query(query, [
            datos.nombre,
            datos.email,
            hashedPassword,
            datos.rol || 'Guia'
        ]);

        return result.rows[0];
    }
};