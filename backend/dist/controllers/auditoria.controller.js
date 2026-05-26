"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditoriaController = void 0;
const auditoria_service_1 = require("../services/auditoria.service");
exports.AuditoriaController = {
    async getLogs(req, res) {
        try {
            // Permitimos recibir un límite por query params, por defecto 100
            const limite = req.query.limite ? parseInt(req.query.limite) : 100;
            const logs = await auditoria_service_1.AuditoriaService.obtenerLogs(limite);
            res.status(200).json(logs);
        }
        catch (error) {
            console.error("Error al obtener logs de auditoría:", error);
            res.status(500).json({ error: 'Error al consultar la auditoría' });
        }
    }
};
