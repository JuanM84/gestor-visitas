"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfiguracionController = void 0;
const configuracion_service_1 = require("../services/configuracion.service");
exports.ConfiguracionController = {
    async getParametro(req, res) {
        try {
            const { clave } = req.params;
            const valor = await configuracion_service_1.ConfiguracionService.obtenerValor(clave);
            res.status(200).json({ clave, valor });
        }
        catch (error) {
            console.error("Error real de BD:", error);
            res.status(500).json({ error: 'Error al obtener configuración' });
        }
    },
    async updateParametro(req, res) {
        try {
            const { clave } = req.params;
            const { valor } = req.body;
            if (!valor)
                return res.status(400).json({ error: 'El valor es requerido' });
            const actualizado = await configuracion_service_1.ConfiguracionService.actualizarValor(clave, valor.toString());
            res.status(200).json({ mensaje: 'Configuración guardada', data: actualizado });
        }
        catch (error) {
            res.status(500).json({ error: 'Error al guardar configuración' });
        }
    }
};
