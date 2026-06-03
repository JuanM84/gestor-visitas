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

    async obtenerPorId(id: string) {
        const result = await pool.query(
            'SELECT id, nombre, email, telefono, rol, activo FROM Usuario WHERE id = $1',
            [id]
        );
        if (!result.rows[0]) throw new Error('Usuario no encontrado');
        return result.rows[0];
    },

    // Actualizar perfil propio (email, teléfono)
    async actualizarPerfil(id: string, datos: { email?: string; telefono?: string }) {
        if (datos.email) {
            // Validar que el email no esté en uso por otro usuario
            const existe = await pool.query(
                'SELECT id FROM Usuario WHERE email = $1 AND id != $2',
                [datos.email, id]
            );
            if (existe.rows.length > 0) {
                throw new Error('El correo electrónico ya está en uso por otro usuario.');
            }
        }
        const result = await pool.query(
            `UPDATE Usuario
             SET email    = COALESCE($1, email),
                 telefono = $2
             WHERE id = $3
             RETURNING id, nombre, email, telefono, rol`,
            [datos.email || null, datos.telefono || null, id]
        );
        if (!result.rows[0]) throw new Error('Usuario no encontrado');
        return result.rows[0];
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
            datos.rol || 'Guía'
        ]);

        return result.rows[0];
    },

    // U-8: No desactivar el único administrador
    async desactivarUsuario(id: string) {
        const targetResult = await pool.query('SELECT rol, activo FROM Usuario WHERE id = $1', [id]);
        const target = targetResult.rows[0];
        if (!target) throw new Error('Usuario no encontrado');
        if (!target.activo) throw new Error('El usuario ya se encuentra inactivo');

        if (target.rol === 'Admin') {
            const adminsResult = await pool.query(
                "SELECT COUNT(*) FROM Usuario WHERE rol = 'Admin' AND activo = true"
            );
            if (parseInt(adminsResult.rows[0].count, 10) <= 1) {
                throw new Error('No se puede desactivar al único administrador del sistema. Asigná otro Admin primero.');
            }
        }

        const result = await pool.query(
            'UPDATE Usuario SET activo = false WHERE id = $1 RETURNING id, nombre, email, rol, activo',
            [id]
        );
        return result.rows[0];
    },

    // Reactivar usuario
    async reactivarUsuario(id: string) {
        const targetResult = await pool.query('SELECT activo, nombre FROM Usuario WHERE id = $1', [id]);
        const target = targetResult.rows[0];
        if (!target) throw new Error('Usuario no encontrado');
        if (target.activo) throw new Error('El usuario ya se encuentra activo');

        const result = await pool.query(
            'UPDATE Usuario SET activo = true WHERE id = $1 RETURNING id, nombre, email, rol, activo',
            [id]
        );
        return result.rows[0];
    },

    // Actualizar datos de un usuario (Admin)
    async actualizarDatos(id: string, datos: { nombre?: string; email?: string; telefono?: string; rol?: string }) {
        const ROLES_VALIDOS = ['Guía', 'Admin'];
        if (datos.rol && !ROLES_VALIDOS.includes(datos.rol)) {
            throw new Error(`Rol inválido. Los valores permitidos son: ${ROLES_VALIDOS.join(', ')}`);
        }
        if (datos.email) {
            const existe = await pool.query(
                'SELECT id FROM Usuario WHERE email = $1 AND id != $2',
                [datos.email, id]
            );
            if (existe.rows.length > 0) throw new Error('El correo electrónico ya está en uso por otro usuario.');
        }
        const result = await pool.query(
            `UPDATE Usuario
             SET nombre   = COALESCE($1, nombre),
                 email    = COALESCE($2, email),
                 telefono = $3,
                 rol      = COALESCE($4, rol)
             WHERE id = $5
             RETURNING id, nombre, email, telefono, rol, activo`,
            [datos.nombre || null, datos.email || null, datos.telefono || null, datos.rol || null, id]
        );
        if (!result.rows[0]) throw new Error('Usuario no encontrado');
        return result.rows[0];
    },

    // A-9: Cambio de contraseña propio (con verificación de la actual)
    async cambiarPassword(usuarioId: string, passwordActual: string, nuevaPassword: string) {
        const result = await pool.query('SELECT password_hash FROM Usuario WHERE id = $1', [usuarioId]);

        const usuario = result.rows[0];
        if (!usuario) throw new Error('Usuario no encontrado');

        const esValida = await bcrypt.compare(passwordActual, usuario.password_hash);
        if (!esValida) throw new Error('La contraseña actual es incorrecta');

        if (nuevaPassword.length < 8) {
            throw new Error('La nueva contraseña debe tener al menos 8 caracteres');
        }
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!passwordRegex.test(nuevaPassword)) {
            throw new Error('La nueva contraseña debe tener al menos una mayúscula, una minúscula y un número');
        }
        if (nuevaPassword === passwordActual) {
            throw new Error('La nueva contraseña debe ser diferente a la actual');
        }

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(nuevaPassword, salt);
        await pool.query('UPDATE Usuario SET password_hash = $1 WHERE id = $2', [hash, usuarioId]);
    }
};