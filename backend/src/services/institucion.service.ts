import { InstitucionRepository } from '../repositories/institucion.repository';
import { pool } from '../config/db';

export const InstitucionService = {
    async obtenerTodas() {
        return await InstitucionRepository.findAll();
    },

    async obtenerPorId(id: string) {
        const inst = await InstitucionRepository.findById(id);
        if (!inst) throw new Error('Institución no encontrada');
        return inst;
    },

    async crearInstitucion(datos: any, usuarioId?: string) {
        if (!datos.nombre?.trim()) {
            throw new Error('El nombre de la institución es obligatorio');
        }

        const nombre = datos.nombre?.trim() || '';
        const localidad = datos.localidad?.trim() || '';
        const provincia = datos.provincia?.trim() || '';
        const pais = datos.pais?.trim() || 'Argentina';

        // Detectar institución duplicada por nombre, localidad, provincia y país
        const duplicado = await pool.query(
            `SELECT id FROM Institucion 
             WHERE LOWER(TRIM(nombre)) = LOWER(TRIM($1))
               AND LOWER(TRIM(COALESCE(localidad, ''))) = LOWER(TRIM($2))
               AND LOWER(TRIM(COALESCE(provincia, ''))) = LOWER(TRIM($3))
               AND LOWER(TRIM(COALESCE(pais, ''))) = LOWER(TRIM($4))`,
            [nombre, localidad, provincia, pais]
        );
        if (duplicado.rows.length > 0) {
            const ubicacionInfo = [localidad, provincia, pais].filter(Boolean).join(', ');
            throw new Error(`Ya existe la institución "${nombre}" registrada en ${ubicacionInfo || 'la misma ubicación'}.`);
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const nueva = await InstitucionRepository.create(datos, client);

            if (usuarioId) {
                await client.query(
                    `INSERT INTO LogAuditoria (usuario_id, accion) VALUES ($1, $2)`,
                    [usuarioId, `Registró nueva institución "${nombre}"`]
                );
            }

            await client.query('COMMIT');
            return nueva;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
};
