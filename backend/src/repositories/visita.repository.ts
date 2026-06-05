import { pool } from '../config/db';

export const VisitaRepository = {
  async findVisitasByFecha(fecha: string) {
    const query = `
        SELECT 
            v.*,
            g.nombre  AS gestor_nombre,
            gr.nombre AS grupo_nombre,
            gr.tipo_visitante,
            gr.tipo_grupo,
            gr.nivel_educativo,
            inst.nombre AS institucion_nombre
        FROM Visita v
        JOIN Gestor g  ON v.gestor_id  = g.id
        JOIN Grupo  gr ON v.grupo_id   = gr.id
        LEFT JOIN Institucion inst ON gr.institucion_id = inst.id
        WHERE v.fecha = $1
        ORDER BY v.hora_inicio ASC
    `;
    const res = await pool.query(query, [fecha]);
    return res.rows;
  },

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

  async getAgrupadoPorMes(anio: number, mes: number) {
    const query = `
      SELECT 
        TO_CHAR(fecha, 'YYYY-MM-DD') as fecha_str,
        SUM(cantidad_personas) as total_personas,
        COUNT(id) as total_grupos
      FROM Visita 
      WHERE EXTRACT(YEAR FROM fecha::date) = $1 
        AND EXTRACT(MONTH FROM fecha::date) = $2
        AND estado != 'Cancelada'
      GROUP BY fecha_str;
    `;
    const result = await pool.query(query, [anio, mes]);
    return result.rows;
  },

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
        JOIN Gestor g  ON v.gestor_id  = g.id
        JOIN Grupo  gr ON v.grupo_id   = gr.id
        LEFT JOIN Institucion inst ON gr.institucion_id = inst.id
        WHERE v.id = $1
    `;
    const res = await pool.query(query, [id]);
    return res.rows[0];
  },

  async updateVisita(id: string, datos: any) {
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

    const detalleDiscapacidad = datos.tiene_discapacidad ? datos.discapacidad_detalle : null;

    const result = await pool.query(query, [
      datos.fecha,
      datos.hora_inicio,
      datos.cantidad_personas,
      datos.estado,
      datos.tipo,
      datos.tiene_cruce_tunel,
      datos.tiene_discapacidad,
      detalleDiscapacidad,
      id
    ]);

    return result.rows[0];
  },

  async updateGrupoObservaciones(visitaId: string, observaciones: string | null) {
    // Actualiza las observaciones del Grupo vinculado a la visita
    const query = `
      UPDATE Grupo
      SET observaciones = $1
      WHERE id = (SELECT grupo_id FROM Visita WHERE id = $2)
      RETURNING observaciones;
    `;
    const result = await pool.query(query, [observaciones, visitaId]);
    return result.rows[0];
  }
};