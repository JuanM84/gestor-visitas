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
        // C-1: Validar rango de aforo máximo
        if (clave === 'capacidad_maxima') {
            const num = parseInt(valor, 10);
            if (isNaN(num) || num < 1 || num > 9999) {
                throw new Error('El aforo debe ser un número entre 1 y 9999');
            }
        }
        // C-2: Validar rango de timeout de sesión
        if (clave === 'session_timeout_minutes') {
            const num = parseInt(valor, 10);
            if (isNaN(num) || num < 1 || num > 480) {
                throw new Error('El timeout de sesión debe estar entre 1 y 480 minutos');
            }
        }

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