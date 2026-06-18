import { pool } from '../config/db';
import bcrypt from 'bcryptjs';
import { validarEmail, validarPassword } from '../utils/validators';

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
    async actualizarPerfil(id: string, datos: { email?: string; telefono?: string }, usuarioId?: string) {
        if (datos.email) {
            if (!validarEmail(datos.email)) {
                throw new Error('El formato del correo electrónico es inválido');
            }
            // Validar que el email no esté en uso por otro usuario
            const existe = await pool.query(
                'SELECT id FROM Usuario WHERE email = $1 AND id != $2',
                [datos.email, id]
            );
            if (existe.rows.length > 0) {
                throw new Error('El correo electrónico ya está en uso por otro usuario.');
            }
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const result = await client.query(
                `UPDATE Usuario
                 SET email    = COALESCE($1, email),
                     telefono = $2
                 WHERE id = $3
                 RETURNING id, nombre, email, telefono, rol`,
                [datos.email || null, datos.telefono || null, id]
            );
            if (!result.rows[0]) throw new Error('Usuario no encontrado');

            if (usuarioId) {
                await client.query(
                    `INSERT INTO LogAuditoria (usuario_id, accion) VALUES ($1, $2)`,
                    [usuarioId, `Actualizó sus datos de perfil (email/teléfono)`]
                );
            }

            await client.query('COMMIT');
            return result.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },

    async crearUsuario(datos: any, usuarioId?: string) {
        // U-5: Validar rol
        const ROLES_VALIDOS = ['Guía', 'Admin'];
        if (datos.rol && !ROLES_VALIDOS.includes(datos.rol)) {
            throw new Error(`Rol inválido. Los valores permitidos son: ${ROLES_VALIDOS.join(', ')}`);
        }

        if (!datos.email || !validarEmail(datos.email)) {
            throw new Error('El formato del correo electrónico es inválido');
        }

        // U-4 / U-6: Validar política de contraseña
        const passwordResult = validarPassword(datos.password);
        if (!passwordResult.valida) {
            throw new Error(passwordResult.mensaje);
        }

        const existe = await pool.query('SELECT id FROM Usuario WHERE email = $1', [datos.email]);
        if (existe.rows.length > 0) {
            throw new Error('El correo electrónico ya está registrado.');
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(datos.password, salt);

        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const query = `
                INSERT INTO Usuario (nombre, email, password_hash, rol) 
                VALUES ($1, $2, $3, $4) 
                RETURNING id, nombre, email, rol, activo
            `;
            const result = await client.query(query, [
                datos.nombre,
                datos.email,
                hashedPassword,
                datos.rol || 'Guía'
            ]);

            if (usuarioId) {
                await client.query(
                    `INSERT INTO LogAuditoria (usuario_id, accion) VALUES ($1, $2)`,
                    [usuarioId, `Registró nuevo usuario "${datos.nombre}" (${datos.rol || 'Guía'})`]
                );
            }

            await client.query('COMMIT');
            return result.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },

    // U-8: No desactivar el único administrador
    async desactivarUsuario(id: string, usuarioId?: string) {
        const targetResult = await pool.query('SELECT nombre, rol, activo FROM Usuario WHERE id = $1', [id]);
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

        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const result = await client.query(
                'UPDATE Usuario SET activo = false WHERE id = $1 RETURNING id, nombre, email, rol, activo',
                [id]
            );

            if (usuarioId) {
                await client.query(
                    `INSERT INTO LogAuditoria (usuario_id, accion) VALUES ($1, $2)`,
                    [usuarioId, `Desactivó al usuario "${target.nombre}"`]
                );
            }

            await client.query('COMMIT');
            return result.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },

    // Reactivar usuario
    async reactivarUsuario(id: string, usuarioId?: string) {
        const targetResult = await pool.query('SELECT activo, nombre FROM Usuario WHERE id = $1', [id]);
        const target = targetResult.rows[0];
        if (!target) throw new Error('Usuario no encontrado');
        if (target.activo) throw new Error('El usuario ya se encuentra activo');

        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const result = await client.query(
                'UPDATE Usuario SET activo = true WHERE id = $1 RETURNING id, nombre, email, rol, activo',
                [id]
            );

            if (usuarioId) {
                await client.query(
                    `INSERT INTO LogAuditoria (usuario_id, accion) VALUES ($1, $2)`,
                    [usuarioId, `Reactivó al usuario "${target.nombre}"`]
                );
            }

            await client.query('COMMIT');
            return result.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },

    // Actualizar datos de un usuario (Admin)
    async actualizarDatos(id: string, datos: { nombre?: string; email?: string; telefono?: string; rol?: string }, usuarioId?: string) {
        const ROLES_VALIDOS = ['Guía', 'Admin'];
        if (datos.rol && !ROLES_VALIDOS.includes(datos.rol)) {
            throw new Error(`Rol inválido. Los valores permitidos son: ${ROLES_VALIDOS.join(', ')}`);
        }
        if (datos.email) {
            if (!validarEmail(datos.email)) {
                throw new Error('El formato del correo electrónico es inválido');
            }
            const existe = await pool.query(
                'SELECT id FROM Usuario WHERE email = $1 AND id != $2',
                [datos.email, id]
            );
            if (existe.rows.length > 0) throw new Error('El correo electrónico ya está en uso por otro usuario.');
        }

        const existeUsuario = await pool.query('SELECT nombre, rol FROM Usuario WHERE id = $1', [id]);
        if (existeUsuario.rows.length === 0) throw new Error('Usuario no encontrado');
        const nombreOriginal = existeUsuario.rows[0].nombre;

        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const result = await client.query(
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

            if (usuarioId) {
                const nombreNuevo = result.rows[0].nombre;
                const msg = nombreNuevo !== nombreOriginal
                    ? `Modificó datos de usuario de "${nombreOriginal}" (renombrado a "${nombreNuevo}")`
                    : `Modificó datos del usuario "${nombreOriginal}"`;
                await client.query(
                    `INSERT INTO LogAuditoria (usuario_id, accion) VALUES ($1, $2)`,
                    [usuarioId, msg]
                );
            }

            await client.query('COMMIT');
            return result.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },

    // A-9: Cambio de contraseña propio (con verificación de la actual)
    async cambiarPassword(usuarioId: string, passwordActual: string, nuevaPassword: string, usuarioSolicitanteId?: string) {
        const result = await pool.query('SELECT password_hash, nombre FROM Usuario WHERE id = $1', [usuarioId]);

        const usuario = result.rows[0];
        if (!usuario) throw new Error('Usuario no encontrado');

        const esValida = await bcrypt.compare(passwordActual, usuario.password_hash);
        if (!esValida) throw new Error('La contraseña actual es incorrecta');

        const passwordResult = validarPassword(nuevaPassword);
        if (!passwordResult.valida) {
            throw new Error(passwordResult.mensaje);
        }
        if (nuevaPassword === passwordActual) {
            throw new Error('La nueva contraseña debe ser diferente a la actual');
        }

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(nuevaPassword, salt);

        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            await client.query('UPDATE Usuario SET password_hash = $1 WHERE id = $2', [hash, usuarioId]);

            if (usuarioSolicitanteId) {
                const accionStr = usuarioId === usuarioSolicitanteId
                    ? `Cambió su propia contraseña`
                    : `Restableció la contraseña del usuario "${usuario.nombre}"`;
                await client.query(
                    `INSERT INTO LogAuditoria (usuario_id, accion) VALUES ($1, $2)`,
                    [usuarioSolicitanteId, accionStr]
                );
            }

            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
};