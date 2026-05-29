import { Request, Response } from 'express';
import { GestorService } from '../services/gestor.service';

const TIPOS_GESTOR_VALIDOS = [
    'Institución Educativa',
    'Agencia de Turismo',
    'Club / Asociación',
    'Particular / Organismo Público'
];

export const GestorController = {
    async getGestores(req: Request, res: Response) {
        try {
            const gestores = await GestorService.obtenerTodos();
            res.status(200).json(gestores);
        } catch (error: any) {
            console.error('Error real de BD:', error);
            res.status(500).json({ error: 'Error al obtener los gestores' });
        }
    },

    async createGestor(req: Request, res: Response) {
        try {
            const { nombre, tipo } = req.body;
            
            if (!nombre) {
                return res.status(400).json({ error: 'El nombre del gestor es obligatorio' });
            }
            
            if (tipo && !TIPOS_GESTOR_VALIDOS.includes(tipo)) {
                return res.status(400).json({ 
                    error: 'El tipo de gestor no es válido. Opciones válidas: ' + TIPOS_GESTOR_VALIDOS.join(', ') 
                });
            }
            
            const nuevoGestor = await GestorService.crearGestor(req.body);
            res.status(201).json({ mensaje: 'Gestor creado exitosamente', gestor: nuevoGestor });
        } catch (error: any) {
            res.status(400).json({ error: error?.message || 'Error al guardar el gestor' });
        }
    }
};