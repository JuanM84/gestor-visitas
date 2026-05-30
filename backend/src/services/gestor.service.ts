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

    async crearGestor(datos: any) {
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

        const query = `
            INSERT INTO Gestor (nombre, tipo, empresa_institucion, telefono, email, localidad, provincia, pais) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
            RETURNING *
        `;
        const result = await pool.query(query, [
            datos.nombre,
            datos.tipo || 'Institución Educativa',
            datos.empresa_institucion || null,
            datos.telefono || null,
            datos.email || null,
            datos.localidad || null,
            datos.provincia || null,
            datos.pais || 'Argentina'
        ]);
        return result.rows[0];
    }
};