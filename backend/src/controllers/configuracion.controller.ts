import { Request, Response } from 'express';
import { ConfiguracionService } from '../services/configuracion.service';

export const ConfiguracionController = {
    async getParametro(req: Request, res: Response) {
        try {
            const { clave } = req.params;
            const valor = await ConfiguracionService.obtenerValor(clave as string);
            res.status(200).json({ clave, valor });
        } catch (error) {
            console.error("Error real de BD:", error);
            res.status(500).json({ error: 'Error al obtener configuración' });
        }
    },

    async updateParametro(req: Request, res: Response) {
        try {
            const { clave } = req.params;
            const { valor } = req.body;

            if (!valor) return res.status(400).json({ error: 'El valor es requerido' });

            const actualizado = await ConfiguracionService.actualizarValor(clave as string, valor.toString());
            res.status(200).json({ mensaje: 'Configuración guardada', data: actualizado });
        } catch (error: any) {
            res.status(400).json({ error: error?.message || 'Error al guardar configuración' });
        }
    }
};