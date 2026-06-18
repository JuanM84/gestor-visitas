import { Request, Response } from 'express';
import { EstadisticasService } from '../services/estadisticas.service';

export const EstadisticasController = {
    async getAdminDashboard(req: Request, res: Response) {
        try {
            const anio = parseInt(req.query.anio as string) || new Date().getFullYear();
            const mes = parseInt(req.query.mes as string) || (new Date().getMonth() + 1);

            const stats = await EstadisticasService.getDashboardAdminStats(mes, anio);
            res.status(200).json(stats);
        } catch (error: any) {
            console.error('Error en estadísticas:', error);
            res.status(500).json({ error: 'Error al obtener estadísticas gerenciales' });
        }
    },

    async getStatsByRango(req: Request, res: Response) {
        try {
            const { desde, hasta } = req.query as { desde: string; hasta: string };
            if (!desde || !hasta) {
                return res.status(400).json({ error: 'Se requieren los parámetros "desde" y "hasta".' });
            }
            if (!/^\d{4}-\d{2}-\d{2}$/.test(desde) || !/^\d{4}-\d{2}-\d{2}$/.test(hasta)) {
                return res.status(400).json({ error: 'Las fechas deben tener formato YYYY-MM-DD.' });
            }
            if (new Date(desde + 'T00:00:00') > new Date(hasta + 'T00:00:00')) {
                return res.status(400).json({ error: 'La fecha "desde" debe ser anterior o igual a "hasta".' });
            }
            const stats = await EstadisticasService.getStatsByRango(desde, hasta);
            res.status(200).json(stats);
        } catch (error: any) {
            console.error('Error en estadísticas por rango:', error);
            res.status(500).json({ error: 'Error al obtener estadísticas por rango' });
        }
    }
};