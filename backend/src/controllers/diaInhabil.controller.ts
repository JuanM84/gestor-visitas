import { Request, Response } from 'express';
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

    async addDia(req: Request, res: Response) {
        try {
            const { fecha, descripcion } = req.body;
            if (!fecha || !descripcion) {
                return res.status(400).json({ error: 'La fecha y descripción son obligatorias' });
            }
            const nuevoDia = await DiaInhabilService.agregar(fecha, descripcion);
            res.status(201).json(nuevoDia);
        } catch (error: any) {
            const msg = error?.message || '';
            const status = msg.includes('ya está registrada') ? 409 : 400;
            res.status(status).json({ error: msg || 'Error al registrar el día inhábil' });
        }
    },

    async deleteDia(req: Request, res: Response) {
        try {
            const { id } = req.params;
            await DiaInhabilService.eliminar(String(id));
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ error: 'Error al eliminar el día inhábil' });
        }
    }
};