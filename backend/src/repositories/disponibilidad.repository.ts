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
            SELECT id FROM DiaInhabil 
            WHERE TO_CHAR(fecha, 'YYYY-MM-DD') = $1
        `;
        const result = await pool.query(query, [fecha]);

        // Si devuelve al menos un registro, el día es inhábil
        return result.rows.length > 0;
    },

    // Control de Solapamiento[cite: 1]
    async existeSolapamiento(fecha: string, hora_inicio: string, visitaIdAExcluir?: string) {
        let query = `
            SELECT COUNT(id) as total
            FROM Visita 
            WHERE fecha = $1 AND hora_inicio = $2 AND estado != 'Cancelada'
        `;
        let valores: any[] = [fecha, hora_inicio];

        // Si viene un ID, lo excluimos de la búsqueda (es porque estamos editando)
        if (visitaIdAExcluir) {
            query += ` AND id != $3`;
            valores.push(visitaIdAExcluir);
        }

        const result = await pool.query(query, valores);
        return parseInt(result.rows[0].total) > 0;
    },

    // Aforo acumulado del día (excluyendo la visita que se está editando si aplica)
    async obtenerPersonasAgendadasEnFecha(fecha: string, visitaIdAExcluir?: string): Promise<number> {
        let query = `
            SELECT COALESCE(SUM(cantidad_personas), 0) as total
            FROM Visita
            WHERE fecha = $1 AND estado != 'Cancelada'
        `;
        const valores: any[] = [fecha];

        if (visitaIdAExcluir) {
            query += ` AND id != $2`;
            valores.push(visitaIdAExcluir);
        }

        const result = await pool.query(query, valores);
        return parseInt(result.rows[0].total, 10);
    }
};