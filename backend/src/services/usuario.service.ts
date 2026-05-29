import { pool } from '../config/db';
import bcrypt from 'bcryptjs';

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
        // U-5: Validar rol
        const ROLES_VALIDOS = ['Guía', 'Admin'];
        if (datos.rol && !ROLES_VALIDOS.includes(datos.rol)) {
            throw new Error(`Rol inválido. Los valores permitidos son: ${ROLES_VALIDOS.join(', ')}`);
        }

        // U-4 / U-6: Validar política de contraseña
        if (!datos.password || datos.password.length < 8) {
            throw new Error('La contraseña debe tener al menos 8 caracteres');
        }
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!passwordRegex.test(datos.password)) {
            throw new Error('La contraseña debe tener al menos una mayúscula, una minúscula y un número');
        }

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