/**
 * @file visita.repository.ts
 * @description Capa de acceso a datos para la entidad Visita.
 *
 * Todas las consultas a la BD relacionadas con visitas pasan por aquí.
 * La lógica de negocio (validaciones, transacciones complejas) está en visita.service.ts.
 *
 * Relaciones que se resuelven en los JOINs:
 *  - Visita → Gestor    (JOIN requerido, todo grupo tiene gestor)
 *  - Visita → Grupo     (JOIN requerido, toda visita tiene grupo)
 *  - Grupo  → Institucion (LEFT JOIN, solo grupos tipo 'Institución')
 */

import { pool } from '../config/db';

export const VisitaRepository = {

    // ─────────────────────────────────────────────────────────────────────────
    // Consultas de Lectura
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Devuelve todas las visitas de una fecha específica, incluyendo datos
     * del gestor, grupo e institución (si aplica). Usado por el Dashboard operativo.
     * Ordenadas por hora_inicio ASC para mostrar el cronograma del día.
     *
     * @param fecha - Fecha en formato 'YYYY-MM-DD'.
     */
    async findVisitasByFecha(fecha: string) {
        const query = `
            SELECT
                v.*,
                g.nombre         AS gestor_nombre,
                gr.nombre        AS grupo_nombre,
                gr.tipo_visitante,
                gr.tipo_grupo,
                gr.nivel_educativo,
                inst.nombre      AS institucion_nombre
            FROM Visita v
            JOIN Gestor      g   ON v.gestor_id        = g.id
            JOIN Grupo       gr  ON v.grupo_id          = gr.id
            LEFT JOIN Institucion inst ON gr.institucion_id = inst.id
            WHERE v.fecha = $1
            ORDER BY v.hora_inicio ASC
        `;
        const res = await pool.query(query, [fecha]);
        return res.rows;
    },

    /**
     * Devuelve el historial completo de visitas con paginación.
     * Usado por la página "Visitantes e Instituciones" (ListadoVisitas).
     *
     * @param page     - Número de página (1-indexed).
     * @param pageSize - Cantidad de registros por página.
     */
    async findHistorialCompleto(page = 1, pageSize = 50) {
        const offset = (page - 1) * pageSize;
        const query = `
            SELECT
                v.id, v.fecha, v.hora_inicio, v.tipo, v.estado, v.cantidad_personas,
                gr.nombre        AS grupo_nombre,
                gr.tipo_visitante AS grupo_tipo,
                g.nombre         AS gestor_nombre
            FROM Visita v
            JOIN Grupo  gr ON v.grupo_id  = gr.id
            JOIN Gestor g  ON v.gestor_id = g.id
            ORDER BY v.fecha DESC, v.hora_inicio DESC
            LIMIT $1 OFFSET $2;
        `;
        const result = await pool.query(query, [pageSize, offset]);
        return result.rows;
    },

    /**
     * Agrupa visitas por día dentro de un mes dado.
     * Devuelve el total de personas y cantidad de grupos (visitas) por fecha.
     * Usado por el Calendario para calcular ocupación y colorear los días.
     * Las visitas Canceladas no se computan.
     *
     * @param anio - Año (ej: 2026).
     * @param mes  - Mes 1-indexed (ej: 6 para junio).
     */
    async getAgrupadoPorMes(anio: number, mes: number) {
        const query = `
            SELECT
                TO_CHAR(fecha, 'YYYY-MM-DD') AS fecha_str,
                SUM(cantidad_personas)        AS total_personas,
                COUNT(id)                     AS total_grupos
            FROM Visita
            WHERE EXTRACT(YEAR  FROM fecha::date) = $1
              AND EXTRACT(MONTH FROM fecha::date) = $2
              AND estado != 'Cancelada'
            GROUP BY fecha_str;
        `;
        const result = await pool.query(query, [anio, mes]);
        return result.rows;
    },

    /**
     * Devuelve una visita por ID con todos sus datos relacionados:
     * Gestor, Grupo, Institución. Usado por DetalleVisita y EditarVisita.
     *
     * @param id - UUID de la visita.
     * @returns El registro completo o undefined si no existe.
     */
    async getById(id: string) {
        const query = `
            SELECT
                v.*,
                g.nombre               AS gestor_nombre,
                g.empresa_institucion  AS gestor_empresa,
                g.telefono             AS gestor_telefono,
                g.email                AS gestor_email,
                gr.nombre              AS grupo_nombre,
                gr.tipo_visitante,
                gr.tipo_grupo,
                gr.nivel_educativo,
                gr.observaciones,
                gr.telefono            AS grupo_telefono,
                gr.email               AS grupo_email,
                gr.localidad           AS grupo_localidad,
                gr.provincia           AS grupo_provincia,
                gr.pais                AS grupo_pais,
                inst.id                AS institucion_id,
                inst.nombre            AS institucion_nombre,
                inst.telefono          AS institucion_telefono,
                inst.email             AS institucion_email,
                inst.localidad         AS institucion_localidad,
                inst.provincia         AS institucion_provincia,
                inst.pais              AS institucion_pais
            FROM Visita v
            JOIN Gestor      g   ON v.gestor_id        = g.id
            JOIN Grupo       gr  ON v.grupo_id          = gr.id
            LEFT JOIN Institucion inst ON gr.institucion_id = inst.id
            WHERE v.id = $1
        `;
        const res = await pool.query(query, [id]);
        return res.rows[0]; // undefined si no existe
    },

    /**
     * Devuelve visitas en un rango de fechas [desde, hasta] inclusive.
     * Usado por el Listado de Visitas y exportación PDF de rango.
     * Ordenadas por fecha y hora ascendente.
     *
     * @param desde - Fecha inicial en formato 'YYYY-MM-DD'.
     * @param hasta - Fecha final en formato 'YYYY-MM-DD'.
     */
    async findVisitasByRango(desde: string, hasta: string) {
        const query = `
            SELECT
                v.*,
                g.nombre         AS gestor_nombre,
                gr.nombre        AS grupo_nombre,
                gr.tipo_visitante,
                gr.tipo_grupo,
                gr.nivel_educativo,
                inst.nombre      AS institucion_nombre
            FROM Visita v
            JOIN Gestor      g   ON v.gestor_id        = g.id
            JOIN Grupo       gr  ON v.grupo_id          = gr.id
            LEFT JOIN Institucion inst ON gr.institucion_id = inst.id
            WHERE v.fecha BETWEEN $1 AND $2
            ORDER BY v.fecha ASC, v.hora_inicio ASC
        `;
        const res = await pool.query(query, [desde, hasta]);
        return res.rows;
    },

    // ─────────────────────────────────────────────────────────────────────────
    // Operaciones de Escritura
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Actualiza los campos editables de una visita.
     * Usa COALESCE para que los campos que no vienen en el payload conserven su valor actual.
     * discapacidad_detalle se limpia a null cuando tiene_discapacidad es false.
     *
     * @param id     - UUID de la visita a modificar.
     * @param datos  - Objeto con los campos a actualizar (todos opcionales salvo el id).
     * @param client - (Opcional) Cliente de transacción. Si no se pasa, usa el pool directo.
     */
    async updateVisita(id: string, datos: any, client?: any) {
        const query = `
            UPDATE Visita
            SET
                fecha                = COALESCE($1, fecha),
                hora_inicio          = COALESCE($2, hora_inicio),
                cantidad_personas    = COALESCE($3, cantidad_personas),
                estado               = COALESCE($4, estado),
                tipo                 = COALESCE($5, tipo),
                tiene_cruce_tunel    = COALESCE($6, tiene_cruce_tunel),
                tiene_discapacidad   = COALESCE($7, tiene_discapacidad),
                discapacidad_detalle = $8
            WHERE id = $9
            RETURNING *;
        `;

        // Si no hay discapacidad, forzamos null para limpiar cualquier detalle previo
        const detalleDiscapacidad = datos.tiene_discapacidad ? datos.discapacidad_detalle : null;

        const db = client || pool; // Permite reutilizar dentro de una transacción
        const result = await db.query(query, [
            datos.fecha,
            datos.hora_inicio,
            datos.cantidad_personas,
            datos.estado,
            datos.tipo,
            datos.tiene_cruce_tunel,
            datos.tiene_discapacidad,
            detalleDiscapacidad,
            id,
        ]);

        return result.rows[0];
    },

    /**
     * Actualiza el campo `observaciones` del Grupo vinculado a una visita.
     * Las observaciones se almacenan en Grupo, no en Visita.
     *
     * @param visitaId      - UUID de la visita (se usa para encontrar su grupo_id).
     * @param observaciones - Texto de observaciones, o null para borrarlas.
     * @param client        - (Opcional) Cliente de transacción.
     */
    async updateGrupoObservaciones(visitaId: string, observaciones: string | null, client?: any) {
        const query = `
            UPDATE Grupo
            SET observaciones = $1
            WHERE id = (SELECT grupo_id FROM Visita WHERE id = $2)
            RETURNING observaciones;
        `;
        const db = client || pool;
        const result = await db.query(query, [observaciones, visitaId]);
        return result.rows[0];
    },

    /**
     * Actualiza el gestor de una visita. Se actualiza tanto en la tabla Visita
     * como en la tabla Grupo para mantener la consistencia del modelo de datos.
     *
     * @param visitaId - UUID de la visita.
     * @param gestorId - UUID del nuevo gestor.
     * @param client   - Cliente de transacción (requerido, se usa dentro de BEGIN/COMMIT).
     */
    async updateGestorVisita(visitaId: string, gestorId: string, client: any) {
        // Actualizar en Visita
        await client.query(
            `UPDATE Visita SET gestor_id = $1 WHERE id = $2`,
            [gestorId, visitaId]
        );
        // Actualizar también en el Grupo asociado (redundancia intencional del modelo)
        await client.query(
            `UPDATE Grupo SET gestor_id = $1 WHERE id = (SELECT grupo_id FROM Visita WHERE id = $2)`,
            [gestorId, visitaId]
        );
    },

    /**
     * Actualiza la institución del Grupo vinculado a una visita.
     * Solo aplica a visitas de tipo 'Institución'.
     *
     * @param visitaId      - UUID de la visita.
     * @param institucionId - UUID de la nueva institución, o null para desvincularla.
     * @param client        - Cliente de transacción (requerido).
     */
    async updateInstitucionGrupo(visitaId: string, institucionId: string | null, client: any) {
        await client.query(
            `UPDATE Grupo SET institucion_id = $1 WHERE id = (SELECT grupo_id FROM Visita WHERE id = $2)`,
            [institucionId, visitaId]
        );
    },
};