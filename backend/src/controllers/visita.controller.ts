import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { VisitaService } from '../services/visita.service';
import { esEstadoVisitaValido, ESTADOS_VISITA } from '../types/visita.types';

export const VisitaController = {
    async getVisitasDashboard(req: Request, res: Response) {
        try {
            const fecha = req.query.fecha as string || new Date().toISOString().split('T')[0];

            const visitas = await VisitaService.obtenerVisitasDelDia(fecha);

            res.status(200).json({
                fecha,
                total: visitas.length,
                data: visitas
            });

        } catch (error: any) {
            console.error('Error en getVisitasDashboard:', error.message);
            res.status(500).json({ error: error.message || 'Error interno del servidor' });
        }
    },

    async getVisitasRango(req: Request, res: Response) {
        try {
            const desde = req.query.desde as string;
            const hasta = req.query.hasta as string;

            if (!desde || !hasta) {
                return res.status(400).json({ error: 'Los parámetros desde y hasta son requeridos' });
            }

            const visitas = await VisitaService.obtenerVisitasRango(desde, hasta);

            res.status(200).json(visitas);
        } catch (error: any) {
            console.error('Error en getVisitasRango:', error.message);
            res.status(500).json({ error: error.message || 'Error interno del servidor' });
        }
    },

    async crearVisita(req: AuthRequest, res: Response) {
        try {
            const datosVisita = req.body;

            const nuevaVisitaId = await VisitaService.registrarNuevaVisita(datosVisita, req.usuario.id);

            res.status(201).json({
                mensaje: 'Visita registrada con éxito',
                visita_id: nuevaVisitaId
            });

        } catch (error: any) {
            console.error('Error en crearVisita:', error.message, error.detail || '', error.constraint || '');
            res.status(400).json({ error: error.message || 'Error al procesar la solicitud' });
        }
    },

    async getHistorial(req: Request, res: Response) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const pageSize = parseInt(req.query.pageSize as string) || 50;
            const historial = await VisitaService.obtenerHistorial(page, pageSize);
            res.status(200).json(historial);
        } catch (error: any) {
            res.status(500).json({ error: 'Error al obtener el historial de visitas' });
        }
    },

    async getCalendario(req: Request, res: Response) {
        try {
            const anio = parseInt(req.query.anio as string) || new Date().getFullYear();
            const mes = parseInt(req.query.mes as string) || (new Date().getMonth() + 1);

            const datos = await VisitaService.obtenerDatosCalendario(anio, mes);
            res.status(200).json(datos);
        } catch (error: any) {
            console.error('ERROR REAL EN CALENDARIO:', error);
            res.status(500).json({ error: 'Error al obtener datos del calendario' });
        }
    },

    async cancelarVisita(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const { motivo } = req.body;
            const usuarioId = req.usuario.id;

            const visita = await VisitaService.cancelarVisita(String(id), usuarioId, motivo);
            res.status(200).json({ mensaje: 'Visita cancelada exitosamente', visita });
        } catch (error: any) {
            const status =
                error.message === 'Visita no encontrada'           ? 404 :
                error.message === 'La visita ya se encuentra cancelada' ? 409 : 500;
            res.status(status).json({ error: error.message });
        }
    },

    async getById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const visita = await VisitaService.obtenerPorId(String(id));
            res.status(200).json(visita);
        } catch (error: any) {
            res.status(404).json({ error: error.message });
        }
    },

    async updateVisita(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const datosAActualizar = req.body;
            const usuarioId = req.usuario.id;

            // Validación del estado si viene en el payload
            if (datosAActualizar.estado !== undefined && !esEstadoVisitaValido(datosAActualizar.estado)) {
                return res.status(400).json({
                    error: `Estado inválido. Valores permitidos: ${ESTADOS_VISITA.join(', ')}`
                });
            }

            const visita = await VisitaService.modificarVisita(String(id), datosAActualizar, usuarioId);
            res.status(200).json({ mensaje: 'Visita modificada exitosamente', visita });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }
};