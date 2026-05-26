"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstadisticasController = void 0;
const estadisticas_service_1 = require("../services/estadisticas.service");
exports.EstadisticasController = {
    async getAdminDashboard(req, res) {
        try {
            const anio = parseInt(req.query.anio) || new Date().getFullYear();
            const mes = parseInt(req.query.mes) || (new Date().getMonth() + 1);
            const stats = await estadisticas_service_1.EstadisticasService.getDashboardAdminStats(mes, anio);
            res.status(200).json(stats);
        }
        catch (error) {
            console.error('Error en estadísticas:', error);
            res.status(500).json({ error: 'Error al obtener estadísticas gerenciales' });
        }
    },
    async getStatsByRango(req, res) {
        try {
            const { desde, hasta } = req.query;
            if (!desde || !hasta) {
                return res.status(400).json({ error: 'Se requieren los parámetros "desde" y "hasta".' });
            }
            if (desde > hasta) {
                return res.status(400).json({ error: 'La fecha "desde" debe ser anterior o igual a "hasta".' });
            }
            const stats = await estadisticas_service_1.EstadisticasService.getStatsByRango(desde, hasta);
            res.status(200).json(stats);
        }
        catch (error) {
            console.error('Error en estadísticas por rango:', error);
            res.status(500).json({ error: 'Error al obtener estadísticas por rango' });
        }
    }
};
