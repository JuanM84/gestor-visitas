import { pool } from '../config/db';

export const DisponibilidadRepository = {

    // Control de Aforo Máximo[cite: 1]
    async obtenerCapacidadMaxima(): Promise<number> {
        try {
            // Intenta buscar la configuración global en la BD[cite: 1]
            const result = await pool.query("SELECT valor FROM Configuracion WHERE clave = 'capacidad_maxima'");
            if (result.rows.length > 0) {
                return parseInt(result.rows[0].valor, 10);
            }
        } catch (error) {
            console.warn("Tabla Configuracion no encontrada, usando aforo por defecto.");
        }
        // Si no existe la configuración, retorna 50 por defecto[cite: 1]
        return 50;
    },

    // Validación de Día Hábil[cite: 1]
    async esDiaInhabil(fecha: string): Promise<boolean> {
        const query = `
            SELECT id FROM Dialnhabil 
            WHERE TO_CHAR(fecha, 'YYYY-MM-DD') = $1
        `;
        const result = await pool.query(query, [fecha]);

        // Si devuelve al menos un registro, el día es inhábil
        return result.rows.length > 0;
    },

    // Control de Solapamiento[cite: 1]
    async existeSolapamiento(fecha: string, hora_inicio: string): Promise<boolean> {
        // Asegura que no exista una visita 'Agendada' o 'En Curso' para la misma fecha y hora[cite: 1]
        const query = `
            SELECT id FROM Visita 
            WHERE TO_CHAR(fecha, 'YYYY-MM-DD') = $1 
            AND hora_inicio = $2 
            AND estado IN ('Agendada', 'En Curso', 'Bloqueado')
        `;
        const result = await pool.query(query, [fecha, hora_inicio]);

        return result.rows.length > 0;
    }
};