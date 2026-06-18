import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
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

    async createGestor(req: AuthRequest, res: Response) {
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
            
            const usuarioId = req.usuario?.id;
            const nuevoGestor = await GestorService.crearGestor(req.body, usuarioId);
            res.status(201).json({ mensaje: 'Gestor creado exitosamente', gestor: nuevoGestor });
        } catch (error: any) {
            res.status(400).json({ error: error?.message || 'Error al guardar el gestor' });
        }
    },

    async updateGestor(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const { nombre, tipo } = req.body;
            
            if (!id) {
                return res.status(400).json({ error: 'El ID del gestor es obligatorio' });
            }
            
            if (nombre !== undefined && !nombre.trim()) {
                return res.status(400).json({ error: 'El nombre del gestor no puede estar vacío' });
            }
            
            if (tipo && !TIPOS_GESTOR_VALIDOS.includes(tipo)) {
                return res.status(400).json({ 
                    error: 'El tipo de gestor no es válido. Opciones válidas: ' + TIPOS_GESTOR_VALIDOS.join(', ') 
                });
            }
            
            const usuarioId = req.usuario?.id;
            const gestorActualizado = await GestorService.actualizarGestor(id as string, req.body, usuarioId);
            res.status(200).json({ mensaje: 'Gestor actualizado exitosamente', gestor: gestorActualizado });
        } catch (error: any) {
            res.status(400).json({ error: error?.message || 'Error al actualizar el gestor' });
        }
    },

    async deleteGestor(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            if (!id) {
                return res.status(400).json({ error: 'El ID del gestor es obligatorio' });
            }
            const usuarioId = req.usuario?.id;
            await GestorService.eliminarGestor(id as string, usuarioId);
            res.status(200).json({ mensaje: 'Gestor eliminado exitosamente' });
        } catch (error: any) {
            res.status(400).json({ error: error?.message || 'Error al eliminar el gestor' });
        }
    }
};