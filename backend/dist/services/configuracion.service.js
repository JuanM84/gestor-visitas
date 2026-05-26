"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfiguracionService = void 0;
const db_1 = require("../config/db");
exports.ConfiguracionService = {
    async obtenerValor(clave) {
        const result = await db_1.pool.query('SELECT valor FROM Configuracion WHERE clave = $1', [clave]);
        if (result.rows.length === 0) {
            if (clave === 'capacidad_maxima')
                return '50';
            return null;
        }
        return result.rows[0].valor;
    },
    async actualizarValor(clave, valor) {
        const existe = await db_1.pool.query('SELECT clave FROM Configuracion WHERE clave = $1', [clave]);
        if (existe.rows.length > 0) {
            const result = await db_1.pool.query('UPDATE Configuracion SET valor = $2 WHERE clave = $1 RETURNING *', [clave, valor]);
            return result.rows[0];
        }
        else {
            const result = await db_1.pool.query('INSERT INTO Configuracion (clave, valor) VALUES ($1, $2) RETURNING *', [clave, valor]);
            return result.rows[0];
        }
    }
};
