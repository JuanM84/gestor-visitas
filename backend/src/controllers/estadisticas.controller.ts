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
    }
};