import { Request, Response } from 'express';
import { AuditoriaService } from '../services/auditoria.service';

export const AuditoriaController = {
    async getLogs(req: Request, res: Response) {
        try {
            // Permitimos recibir un límite por query params, por defecto 100
            const limite = req.query.limite ? parseInt(req.query.limite as string) : 100;
            const logs = await AuditoriaService.obtenerLogs(limite);

            res.status(200).json(logs);
        } catch (error: any) {
            console.error("Error al obtener logs de auditoría:", error);
            res.status(500).json({ error: 'Error al consultar la auditoría' });
        }
    }
};