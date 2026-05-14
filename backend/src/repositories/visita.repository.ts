import { pool } from '../config/db';

export const VisitaRepository = {
  async findVisitasByFecha(fecha: string) {
    const query = `
        SELECT 
            v.*, 
            g.nombre as gestor_nombre, 
            gr.nombre as grupo_nombre
        FROM Visita v
        JOIN Gestor g ON v.gestor_id = g.id
        JOIN Grupo gr ON v.grupo_id = gr.id
        WHERE v.fecha = $1
        ORDER BY v.hora_inicio ASC
    `;
    const res = await pool.query(query, [fecha]);
    return res.rows;
  },
  async findHistorialCompleto() {
    const query = `
      SELECT 
        v.id, v.fecha, v.hora_inicio, v.tipo, v.estado, v.cantidad_personas,
        g.nombre as grupo_nombre,
        g.tipo as grupo_tipo,
        gest.nombre as gestor_nombre
      FROM Visita v
      JOIN Grupo g ON v.grupo_id = g.id
      JOIN Gestor gest ON v.gestor_id = gest.id
      ORDER BY v.fecha DESC, v.hora_inicio DESC;
    `;
    const result = await pool.query(query);
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
  async cancelarVisita(id: string) {
    const query = `
      UPDATE Visita 
      SET estado = 'Cancelada' 
      WHERE id = $1 
      RETURNING id, fecha, hora_inicio, estado
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },
  async getById(id: string) {
    const query = `
        SELECT 
            v.*, 
            g.nombre as gestor_nombre, 
            gr.nombre as grupo_nombre,
            gr.descripcion as grupo_descripcion,
            gr.nivel_educativo
        FROM Visita v
        JOIN Gestor g ON v.gestor_id = g.id
        JOIN Grupo gr ON v.grupo_id = gr.id
        WHERE v.id = $1
    `;
    const res = await pool.query(query, [id]);
    return res.rows[0];
  },
  async updateVisita(id: string, datos: any) {
    const query = `
      UPDATE Visita 
      SET 
        fecha = COALESCE($1, fecha),
        hora_inicio = COALESCE($2, hora_inicio),
        cantidad_personas = COALESCE($3, cantidad_personas),
        estado = COALESCE($4, estado),
        tipo = COALESCE($5, tipo),
        tiene_cruce_tunel = COALESCE($6, tiene_cruce_tunel),
        tiene_discapacidad = COALESCE($7, tiene_discapacidad),
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
  }
};