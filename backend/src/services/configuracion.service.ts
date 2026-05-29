import { pool } from '../config/db';

export const ConfiguracionService = {
    async obtenerValor(clave: string) {
        const result = await pool.query('SELECT valor FROM Configuracion WHERE clave = $1', [clave]);
        if (result.rows.length === 0) {
            if (clave === 'capacidad_maxima') return '50';
            if (clave === 'session_timeout_minutes') return '30';
            return null;
        }
        return result.rows[0].valor;
    },

    async actualizarValor(clave: string, valor: string) {
        const existe = await pool.query('SELECT clave FROM Configuracion WHERE clave = $1', [clave]);

        if (existe.rows.length > 0) {
            const result = await pool.query('UPDATE Configuracion SET valor = $2 WHERE clave = $1 RETURNING *', [clave, valor]);
            return result.rows[0];
        } else {
            const result = await pool.query('INSERT INTO Configuracion (clave, valor) VALUES ($1, $2) RETURNING *', [clave, valor]);
            return result.rows[0];
        }
    }
};