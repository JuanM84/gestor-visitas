/**
 * @file configuracion.service.ts
 * @description Servicio para leer y actualizar los parámetros globales del sistema.
 *
 * Los parámetros se almacenan en la tabla Configuracion como pares clave-valor.
 * Parámetros actualmente gestionados:
 *
 *  | Clave                    | Descripción                                   | Default |
 *  |--------------------------|-----------------------------------------------|---------|
 *  | capacidad_maxima         | Máximo de personas por día (aforo diario)     | 300     |
 *  | capacidad_por_turno      | Máximo de personas por turno (hora + fecha)   | 80      |
 *  | session_timeout_minutes  | Minutos de inactividad hasta cerrar sesión    | 30      |
 *
 * Cada cambio queda registrado en LogAuditoria con el usuario que lo realizó.
 */

import { pool } from '../config/db';

export const ConfiguracionService = {

    /**
     * Obtiene el valor de un parámetro de configuración por su clave.
     * Si el parámetro no existe en la BD, retorna el valor por defecto definido aquí.
     *
     * @param clave - Identificador del parámetro (ej: 'capacidad_maxima').
     * @returns Valor como string, o null si la clave no existe y no tiene default.
     */
    async obtenerValor(clave: string): Promise<string | null> {
        const result = await pool.query(
            'SELECT valor FROM Configuracion WHERE clave = $1',
            [clave]
        );

        if (result.rows.length === 0) {
            // Valores por defecto si el parámetro aún no fue guardado en la BD
            if (clave === 'capacidad_maxima')        return '300';
            if (clave === 'capacidad_por_turno')     return '80';
            if (clave === 'session_timeout_minutes') return '30';
            return null;
        }

        return result.rows[0].valor;
    },

    /**
     * Actualiza (o crea si no existe) un parámetro de configuración.
     * Aplica validaciones de rango según el tipo de clave.
     * Registra el cambio en LogAuditoria si se provee un usuarioId.
     *
     * @param clave     - Identificador del parámetro a actualizar.
     * @param valor     - Nuevo valor (siempre se almacena como string).
     * @param usuarioId - (Opcional) ID del usuario que realiza el cambio, para auditoría.
     * @throws Error si el valor no cumple las validaciones de rango del parámetro.
     */
    async actualizarValor(clave: string, valor: string, usuarioId?: string) {

        // ── Validaciones de rango por tipo de clave ───────────────────────────

        // C-1: Aforo diario — número entero entre 1 y 9999
        if (clave === 'capacidad_maxima') {
            const num = parseInt(valor, 10);
            if (isNaN(num) || num < 1 || num > 9999) {
                throw new Error('El aforo diario debe ser un número entre 1 y 9999');
            }
        }

        // C-2: Capacidad por turno — número entero entre 1 y 9999
        if (clave === 'capacidad_por_turno') {
            const num = parseInt(valor, 10);
            if (isNaN(num) || num < 1 || num > 9999) {
                throw new Error('La capacidad por turno debe ser un número entre 1 y 9999');
            }
        }

        // C-3: Timeout de sesión — minutos entre 1 y 480 (8 horas máximo)
        if (clave === 'session_timeout_minutes') {
            const num = parseInt(valor, 10);
            if (isNaN(num) || num < 1 || num > 480) {
                throw new Error('El timeout de sesión debe estar entre 1 y 480 minutos');
            }
        }

        // ── Lectura del valor anterior (para el log de auditoría) ─────────────
        const existe        = await pool.query('SELECT clave, valor FROM Configuracion WHERE clave = $1', [clave]);
        const valorAnterior = existe.rows.length > 0 ? existe.rows[0].valor : null;

        // ── Transacción: UPDATE o INSERT + registro de auditoría ──────────────
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            let result;
            if (existe.rows.length > 0) {
                // El parámetro ya existe → actualizamos su valor
                result = await client.query(
                    'UPDATE Configuracion SET valor = $2 WHERE clave = $1 RETURNING *',
                    [clave, valor]
                );
            } else {
                // El parámetro no existe → lo creamos por primera vez
                result = await client.query(
                    'INSERT INTO Configuracion (clave, valor) VALUES ($1, $2) RETURNING *',
                    [clave, valor]
                );
            }

            // Registrar en auditoría si viene con usuario (las actualizaciones manuales siempre lo tienen)
            if (usuarioId) {
                // Nombre legible del parámetro para el log
                const nombreParametro =
                    clave === 'capacidad_maxima'        ? 'Aforo máximo diario'  :
                    clave === 'capacidad_por_turno'     ? 'Capacidad por turno'  :
                    clave === 'session_timeout_minutes' ? 'Timeout de sesión'    : clave;

                // Descripción del cambio: "de X a Y" si existía, "a Y" si es nuevo
                const valorDetalle = valorAnterior !== null
                    ? `de "${valorAnterior}" a "${valor}"`
                    : `a "${valor}"`;

                await client.query(
                    `INSERT INTO LogAuditoria (usuario_id, accion) VALUES ($1, $2)`,
                    [usuarioId, `Actualizó configuración "${nombreParametro}" ${valorDetalle}`]
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
};