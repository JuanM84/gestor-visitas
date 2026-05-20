import { Request, Response } from 'express';
import { InstitucionService } from '../services/institucion.service';

export const InstitucionController = {
    async getInstituciones(req: Request, res: Response) {
        try {
            const instituciones = await InstitucionService.obtenerTodas();
            res.status(200).json(instituciones);
        } catch (error: any) {
            res.status(500).json({ error: 'Error al obtener las instituciones' });
        }
    },

    async createInstitucion(req: Request, res: Response) {
        try {
            const nueva = await InstitucionService.crearInstitucion(req.body);
            res.status(201).json({ mensaje: 'Institución creada exitosamente', institucion: nueva });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }
};
