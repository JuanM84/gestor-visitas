import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { DiaInhabilService } from '../services/diaInhabil.service';

export const DiaInhabilController = {
    async getDias(req: Request, res: Response) {
        try {
            const dias = await DiaInhabilService.obtenerTodos();
            res.status(200).json(dias);
        } catch (error) {
            res.status(500).json({ error: 'Error al obtener días inhábiles' });
        }
    },

    async addDia(req: AuthRequest, res: Response) {
        try {
            const { fecha, descripcion } = req.body;
            if (!fecha || !descripcion) {
                return res.status(400).json({ error: 'La fecha y descripción son obligatorias' });
            }
            const usuarioId = req.usuario?.id;
            const nuevoDia = await DiaInhabilService.agregar(fecha, descripcion, usuarioId);
            res.status(201).json(nuevoDia);
        } catch (error: any) {
            const msg = error?.message || '';
            const status = msg.includes('ya está registrada') ? 409 : 400;
            res.status(status).json({ error: msg || 'Error al registrar el día inhábil' });
        }
    },

    async deleteDia(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const usuarioId = req.usuario?.id;
            await DiaInhabilService.eliminar(String(id), usuarioId);
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ error: 'Error al eliminar el día inhábil' });
        }
    }
};