/**
 * @file disponibilidad.repository.ts
 * @description Capa de acceso a datos para las validaciones de disponibilidad.
 *
 * Responsabilidades:
 *  - Leer parámetros de capacidad desde la tabla Configuracion.
 *  - Consultar cuántas personas están agendadas en un día o turno específico.
 *  - Verificar si una fecha es inhábil.
 *
 * NOTA: Este repositorio NO lanza errores de negocio. Solo devuelve datos.
 * La lógica de decisión (rechazar o aceptar) está en disponibilidad.service.ts.
 */

import { pool } from '../config/db';

export const DisponibilidadRepository = {

    // ─────────────────────────────────────────────────────────────────────────
    // Parámetros de Configuración
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Devuelve el aforo máximo diario configurado en la tabla Configuracion.
     * Si el parámetro no existe en la BD, retorna 300 como valor seguro por defecto.
     */
    async obtenerCapacidadMaxima(): Promise<number> {
        try {
            const result = await pool.query(
                "SELECT valor FROM Configuracion WHERE clave = 'capacidad_maxima'"
            );
            if (result.rows.length > 0) {
                return parseInt(result.rows[0].valor, 10);
            }
        } catch (error) {
            console.warn('[DisponibilidadRepository] Tabla Configuracion no encontrada, usando aforo diario por defecto (300).');
        }
        return 300;
    },

    /**
     * Devuelve la capacidad máxima de personas permitidas en un mismo turno horario.
     * Permite que múltiples grupos compartan el mismo slot (fecha + hora_inicio)
     * mientras no superen este límite acumulado.
     * Si el parámetro no existe en la BD, retorna 80 como valor por defecto.
     */
    async obtenerCapacidadPorTurno(): Promise<number> {
        try {
            const result = await pool.query(
                "SELECT valor FROM Configuracion WHERE clave = 'capacidad_por_turno'"
            );
            if (result.rows.length > 0) {
                return parseInt(result.rows[0].valor, 10);
            }
        } catch (error) {
            console.warn("[DisponibilidadRepository] Parámetro 'capacidad_por_turno' no encontrado, usando valor por defecto (80).");
        }
        return 80;
    },

    // ─────────────────────────────────────────────────────────────────────────
    // Consultas de Ocupación
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Verifica si una fecha está marcada como inhábil en la tabla DiaInhabil.
     * @param fecha - Fecha en formato 'YYYY-MM-DD'.
     * @returns true si el día es inhábil, false si está disponible para visitas.
     */
    async esDiaInhabil(fecha: string): Promise<boolean> {
        const query = `
            SELECT id FROM DiaInhabil
            WHERE TO_CHAR(fecha, 'YYYY-MM-DD') = $1
        `;
        const result = await pool.query(query, [fecha]);
        return result.rows.length > 0;
    },

    /**
     * Suma la cantidad de personas agendadas en un turno específico (fecha + hora_inicio).
     * Excluye visitas Canceladas y, opcionalmente, la visita que se está editando
     * para que no compita contra sí misma al recalcular su propio cupo.
     *
     * @param fecha            - Fecha en formato 'YYYY-MM-DD'.
     * @param hora_inicio      - Hora del turno en formato 'HH:MM' o 'HH:MM:SS'.
     * @param visitaIdAExcluir - ID de la visita a ignorar (usado al editar una visita existente).
     * @returns Total de personas ya comprometidas en ese turno.
     */
    async obtenerPersonasPorTurno(
        fecha: string,
        hora_inicio: string,
        visitaIdAExcluir?: string
    ): Promise<number> {
        let query = `
            SELECT COALESCE(SUM(cantidad_personas), 0) AS total
            FROM Visita
            WHERE fecha = $1
              AND hora_inicio = $2
              AND estado != 'Cancelada'
        `;
        const valores: any[] = [fecha, hora_inicio];

        // Si se está editando una visita existente, la excluimos del cómputo
        // para evitar que su propia cantidad se cuente como "ocupada".
        if (visitaIdAExcluir) {
            query += ` AND id != $3`;
            valores.push(visitaIdAExcluir);
        }

        const result = await pool.query(query, valores);
        return parseInt(result.rows[0].total, 10);
    },

    /**
     * Suma la cantidad total de personas agendadas en un día completo (todas las horas).
     * Excluye visitas Canceladas y, opcionalmente, la visita que se está editando.
     * Utilizado para validar el aforo máximo diario.
     *
     * @param fecha            - Fecha en formato 'YYYY-MM-DD'.
     * @param visitaIdAExcluir - ID de la visita a ignorar (usado al editar una visita existente).
     * @returns Total de personas agendadas en el día.
     */
    async obtenerPersonasAgendadasEnFecha(
        fecha: string,
        visitaIdAExcluir?: string
    ): Promise<number> {
        let query = `
            SELECT COALESCE(SUM(cantidad_personas), 0) AS total
            FROM Visita
            WHERE fecha = $1
              AND estado != 'Cancelada'
        `;
        const valores: any[] = [fecha];

        if (visitaIdAExcluir) {
            query += ` AND id != $2`;
            valores.push(visitaIdAExcluir);
        }

        const result = await pool.query(query, valores);
        return parseInt(result.rows[0].total, 10);
    },
};