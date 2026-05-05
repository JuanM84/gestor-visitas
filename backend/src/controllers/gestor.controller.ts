import { Request, Response } from 'express';
import { GestorService } from '../services/gestor.service';

export const GestorController = {
    async getGestores(req: Request, res: Response) {
        try {
            const gestores = await GestorService.obtenerTodos();
            res.status(200).json(gestores);
        } catch (error: any) {
            console.error("Error real de BD:", error);
            res.status(500).json({ error: 'Error al obtener los gestores' });
        }
    },

    async createGestor(req: Request, res: Response) {
        try {
            const { nombre, tipo } = req.body;
            if (!nombre || !tipo) {
                return res.status(400).json({ error: 'El nombre y el tipo son obligatorios' });
            }

            const nuevoGestor = await GestorService.crearGestor(req.body);
            res.status(201).json({ mensaje: 'Gestor creado exitosamente', gestor: nuevoGestor });
        } catch (error: any) {
            res.status(500).json({ error: 'Error al guardar el gestor' });
        }
    }
};