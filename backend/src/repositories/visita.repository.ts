import { pool } from '../config/db';

export const VisitaRepository = {
  // Busca las visitas de una fecha específica, uniendo datos del gestor y grupo
  async findVisitasByFecha(fecha: string) {
    const query = `
      SELECT 
        v.id, v.hora_inicio, v.tipo, v.estado, v.cantidad_personas,
        g.nombre as grupo_nombre,
        gest.nombre as gestor_nombre
      FROM Visita v
      LEFT JOIN Grupo g ON v.grupo_id = g.id
      LEFT JOIN Gestor gest ON v.gestor_id = gest.id
      WHERE v.fecha = $1
      ORDER BY v.hora_inicio ASC;
    `;
    const result = await pool.query(query, [fecha]);
    return result.rows;
  },
  async crearVisitaTransaccional(datos: any) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN'); // Arranca la transacción

      let gestorId = datos.gestor_id;

      // 1. Si es un gestor nuevo, lo creamos primero
      if (datos.es_nuevo_gestor) {
        const gestorResult = await client.query(
          `INSERT INTO Gestor (nombre, tipo, telefono, email, localidad, provincia, pais)
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
          [datos.gestor.nombre, datos.gestor.tipo, datos.gestor.telefono, datos.gestor.email, datos.gestor.localidad, datos.gestor.provincia, datos.gestor.pais]
        );
        gestorId = gestorResult.rows[0].id; // Capturamos el UUID generado
      }

      // 2. Creamos el Grupo asociado al Gestor
      const grupoResult = await client.query(
        `INSERT INTO Grupo (nombre, tipo, nivel_educativo, descripcion, gestor_id)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [datos.grupo.nombre, datos.grupo.tipo, datos.grupo.nivel_educativo, datos.grupo.descripcion, gestorId]
      );
      const grupoId = grupoResult.rows[0].id;

      // 3. Creamos la Visita asociada al Grupo y al Gestor
      const visitaResult = await client.query(
        `INSERT INTO Visita (gestor_id, usuario_registro_id, grupo_id, fecha, hora_inicio, tipo, tiene_cruce_tunel, cantidad_personas, estado)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Agendada') RETURNING id`,
        [gestorId, datos.usuario_registro_id, grupoId, datos.visita.fecha, datos.visita.hora_inicio, datos.visita.tipo, datos.visita.tiene_cruce_tunel, datos.visita.cantidad_personas]
      );

      await client.query('COMMIT');
      return visitaResult.rows[0].id;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release(); // Devolvemos el cliente al pool
    }
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
        v.id, v.fecha, v.hora_inicio, v.tipo as visita_tipo, v.tiene_cruce_tunel, v.cantidad_personas, v.estado, v.created_at,
        g.nombre as grupo_nombre, g.tipo as grupo_tipo, g.nivel_educativo, g.descripcion as grupo_descripcion,
        gest.nombre as gestor_nombre, gest.tipo as gestor_tipo, gest.telefono, gest.email,
        u.nombre as usuario_registro
      FROM Visita v
      JOIN Grupo g ON v.grupo_id = g.id
      JOIN Gestor gest ON v.gestor_id = gest.id
      JOIN Usuario u ON v.usuario_registro_id = u.id
      WHERE v.id = $1;
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },
  async updateVisita(id: string, datos: any) {
    const query = `
      UPDATE Visita 
      SET 
        fecha = COALESCE($1, fecha),
        hora_inicio = COALESCE($2, hora_inicio),
        cantidad_personas = COALESCE($3, cantidad_personas),
        estado = COALESCE($4, estado)
      WHERE id = $5 
      RETURNING *;
    `;
    const result = await pool.query(query, [
      datos.fecha,
      datos.hora_inicio,
      datos.cantidad_personas,
      datos.estado,
      id
    ]);
    return result.rows[0];
  }
};