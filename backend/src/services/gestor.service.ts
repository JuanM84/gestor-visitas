import { pool } from '../config/db';
import { validarTelefono } from '../utils/validators';

export const GestorService = {
    async obtenerTodos() {
        const query = `
            SELECT id, nombre, tipo, empresa_institucion, telefono, email, localidad, provincia, pais 
            FROM Gestor 
            ORDER BY nombre ASC
        `;
        const result = await pool.query(query);
        return result.rows;
    },

    async crearGestor(datos: any, usuarioId?: string) {
        // G-1: Validar nombre obligatorio
        if (!datos.nombre?.trim()) {
            throw new Error('El nombre del gestor es obligatorio');
        }

        // V-20: Validar formato de teléfono si se proporciona
        if (datos.telefono?.trim() && !validarTelefono(datos.telefono)) {
            throw new Error('El número de teléfono del gestor no tiene un formato válido (ej: 0343-4000000)');
        }

        // G-4: Detectar duplicado por nombre + empresa/institución
        const nombreNorm = datos.nombre.trim().toLowerCase();
        const empresaNorm = (datos.empresa_institucion || '').trim().toLowerCase();
        const duplicado = await pool.query(
            `SELECT id FROM Gestor WHERE LOWER(TRIM(nombre)) = $1 AND LOWER(TRIM(COALESCE(empresa_institucion, ''))) = $2`,
            [nombreNorm, empresaNorm]
        );
        if (duplicado.rows.length > 0) {
            throw new Error(
                datos.empresa_institucion
                    ? `Ya existe un gestor llamado "${datos.nombre}" en "${datos.empresa_institucion}"`
                    : `Ya existe un gestor llamado "${datos.nombre}"`
            );
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const query = `
                INSERT INTO Gestor (nombre, tipo, empresa_institucion, telefono, email, localidad, provincia, pais) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
                RETURNING *
            `;
            const result = await client.query(query, [
                datos.nombre,
                datos.tipo || 'Institución Educativa',
                datos.empresa_institucion || null,
                datos.telefono || null,
                datos.email || null,
                datos.localidad || null,
                datos.provincia || null,
                datos.pais || 'Argentina'
            ]);

            if (usuarioId) {
                await client.query(
                    `INSERT INTO LogAuditoria (usuario_id, accion) VALUES ($1, $2)`,
                    [usuarioId, `Registró nuevo gestor "${datos.nombre}"`]
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

    async actualizarGestor(id: string, datos: any, usuarioId?: string) {
        // 1. Validar si el gestor existe
        const existe = await pool.query('SELECT id, nombre, empresa_institucion FROM Gestor WHERE id = $1', [id]);
        if (existe.rows.length === 0) {
            throw new Error('El gestor no existe');
        }
        const nombreOriginal = existe.rows[0].nombre;

        // 2. Validar nombre obligatorio si se envía
        if (datos.nombre !== undefined && !datos.nombre?.trim()) {
            throw new Error('El nombre del gestor es obligatorio');
        }

        // 3. Validar formato de teléfono si se proporciona
        if (datos.telefono?.trim() && !validarTelefono(datos.telefono)) {
            throw new Error('El número de teléfono del gestor no tiene un formato válido (ej: 0343-4000000)');
        }

        const nombreFinal = datos.nombre !== undefined ? datos.nombre.trim() : existe.rows[0].nombre;
        const empresaFinal = datos.empresa_institucion !== undefined ? (datos.empresa_institucion || '').trim() : (existe.rows[0].empresa_institucion || '');

        // 4. Detectar duplicado por nombre + empresa/institución (excluyendo el id actual)
        const duplicado = await pool.query(
            `SELECT id FROM Gestor WHERE LOWER(TRIM(nombre)) = $1 AND LOWER(TRIM(COALESCE(empresa_institucion, ''))) = $2 AND id <> $3`,
            [nombreFinal.toLowerCase(), empresaFinal.toLowerCase(), id]
        );
        if (duplicado.rows.length > 0) {
            throw new Error(
                empresaFinal
                    ? `Ya existe otro gestor llamado "${nombreFinal}" en "${empresaFinal}"`
                    : `Ya existe otro gestor llamado "${nombreFinal}"`
            );
        }

        // 5. Construir y ejecutar query de actualización dinámica
        const campos: string[] = [];
        const valores: any[] = [];
        let index = 1;

        const mapeo = {
            nombre: datos.nombre !== undefined ? datos.nombre : undefined,
            tipo: datos.tipo !== undefined ? datos.tipo : undefined,
            empresa_institucion: datos.empresa_institucion !== undefined ? (datos.empresa_institucion || null) : undefined,
            telefono: datos.telefono !== undefined ? (datos.telefono || null) : undefined,
            email: datos.email !== undefined ? (datos.email || null) : undefined,
            localidad: datos.localidad !== undefined ? (datos.localidad || null) : undefined,
            provincia: datos.provincia !== undefined ? (datos.provincia || null) : undefined,
            pais: datos.pais !== undefined ? (datos.pais || 'Argentina') : undefined
        };

        for (const [col, val] of Object.entries(mapeo)) {
            if (val !== undefined) {
                campos.push(`${col} = $${index}`);
                valores.push(val);
                index++;
            }
        }

        if (campos.length === 0) {
            return existe.rows[0];
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            valores.push(id);
            const queryUpdate = `
                UPDATE Gestor 
                SET ${campos.join(', ')} 
                WHERE id = $${index} 
                RETURNING *
            `;
            const resultUpdate = await client.query(queryUpdate, valores);

            if (usuarioId) {
                const nombreNuevo = resultUpdate.rows[0].nombre;
                const msg = nombreNuevo !== nombreOriginal
                    ? `Modificó gestor "${nombreOriginal}" (renombrado a "${nombreNuevo}")`
                    : `Modificó gestor "${nombreOriginal}"`;
                await client.query(
                    `INSERT INTO LogAuditoria (usuario_id, accion) VALUES ($1, $2)`,
                    [usuarioId, msg]
                );
            }

            await client.query('COMMIT');
            return resultUpdate.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },

    async eliminarGestor(id: string, usuarioId?: string) {
        // 1. Validar si el gestor existe
        const existe = await pool.query('SELECT id, nombre FROM Gestor WHERE id = $1', [id]);
        if (existe.rows.length === 0) {
            throw new Error('El gestor no existe');
        }
        const nombreGestor = existe.rows[0].nombre;

        // 2. Verificar referencias en Visita
        const visitasRef = await pool.query('SELECT COUNT(*) FROM Visita WHERE gestor_id = $1', [id]);
        if (parseInt(visitasRef.rows[0].count, 10) > 0) {
            throw new Error('No se puede eliminar el gestor porque tiene visitas asociadas.');
        }

        // 3. Verificar referencias en Grupo
        const gruposRef = await pool.query('SELECT COUNT(*) FROM Grupo WHERE gestor_id = $1', [id]);
        if (parseInt(gruposRef.rows[0].count, 10) > 0) {
            throw new Error('No se puede eliminar el gestor porque tiene grupos asociados.');
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            // 4. Eliminar
            await client.query('DELETE FROM Gestor WHERE id = $1', [id]);

            if (usuarioId) {
                await client.query(
                    `INSERT INTO LogAuditoria (usuario_id, accion) VALUES ($1, $2)`,
                    [usuarioId, `Eliminó el gestor "${nombreGestor}"`]
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