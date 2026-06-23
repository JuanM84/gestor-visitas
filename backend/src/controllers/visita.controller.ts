/**
 * @file visita.controller.ts
 * @description Controller HTTP para los endpoints de Visita.
 *
 * Responsabilidades de este layer:
 *  - Extraer y validar los parámetros de la request (query, params, body).
 *  - Delegar la lógica de negocio a VisitaService.
 *  - Mapear el resultado a la respuesta HTTP correcta (status code + JSON).
 *  - Traducir errores conocidos a códigos HTTP semánticos (404, 409, etc.).
 *
 * Rutas que usa este controller (ver visita.routes.ts):
 *  GET    /api/visitas              → getVisitasDashboard  (dashboard del día)
 *  GET    /api/visitas/rango        → getVisitasRango      (listado por período)
 *  GET    /api/visitas/historial    → getHistorial         (paginado completo)
 *  GET    /api/visitas/calendario   → getCalendario        (datos del mes)
 *  GET    /api/visitas/:id          → getById              (detalle de una visita)
 *  POST   /api/visitas              → crearVisita          (registrar nueva visita)
 *  PUT    /api/visitas/:id          → updateVisita         (editar visita existente)
 *  PATCH  /api/visitas/:id/cancelar → cancelarVisita       (cancelar con motivo)
 */

import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { VisitaService } from '../services/visita.service';
import { esEstadoVisitaValido, ESTADOS_VISITA } from '../types/visita.types';

export const VisitaController = {

    /**
     * GET /api/visitas?fecha=YYYY-MM-DD
     * Devuelve todas las visitas de un día específico para el Dashboard operativo.
     * Si no se pasa fecha, usa el día actual del servidor.
     */
    async getVisitasDashboard(req: Request, res: Response) {
        try {
            const fecha = (req.query.fecha as string) || new Date().toISOString().split('T')[0];
            const visitas = await VisitaService.obtenerVisitasDelDia(fecha);

            res.status(200).json({
                fecha,
                total: visitas.length,
                data: visitas,
            });
        } catch (error: any) {
            console.error('Error en getVisitasDashboard:', error.message);
            res.status(500).json({ error: error.message || 'Error interno del servidor' });
        }
    },

    /**
     * GET /api/visitas/rango?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
     * Devuelve visitas en el rango [desde, hasta] para el Listado de Visitas.
     * Ambos parámetros son obligatorios.
     */
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

    /**
     * POST /api/visitas
     * Registra una nueva visita con su gestor y grupo asociados.
     * Toda la validación de negocio y las inserciones en transacción
     * se realizan en VisitaService.registrarNuevaVisita.
     */
    async crearVisita(req: AuthRequest, res: Response) {
        try {
            const datosVisita = req.body;
            const nuevaVisitaId = await VisitaService.registrarNuevaVisita(datosVisita, req.usuario.id);

            res.status(201).json({
                mensaje: 'Visita registrada con éxito',
                visita_id: nuevaVisitaId,
            });
        } catch (error: any) {
            console.error('Error en crearVisita:', error.message, error.detail || '', error.constraint || '');
            res.status(400).json({ error: error.message || 'Error al procesar la solicitud' });
        }
    },

    /**
     * GET /api/visitas/historial?page=1&pageSize=50
     * Devuelve el historial completo paginado de visitas.
     * Usado por la página "Visitantes e Instituciones".
     */
    async getHistorial(req: Request, res: Response) {
        try {
            const page     = parseInt(req.query.page     as string) || 1;
            const pageSize = parseInt(req.query.pageSize as string) || 50;
            const historial = await VisitaService.obtenerHistorial(page, pageSize);
            res.status(200).json(historial);
        } catch (error: any) {
            res.status(500).json({ error: 'Error al obtener el historial de visitas' });
        }
    },

    /**
     * GET /api/visitas/calendario?anio=2026&mes=6
     * Devuelve los datos de ocupación por día para renderizar el calendario mensual.
     * Si no se pasan parámetros, usa el mes actual del servidor.
     */
    async getCalendario(req: Request, res: Response) {
        try {
            const anio = parseInt(req.query.anio as string) || new Date().getFullYear();
            const mes  = parseInt(req.query.mes  as string) || (new Date().getMonth() + 1);

            const datos = await VisitaService.obtenerDatosCalendario(anio, mes);
            res.status(200).json(datos);
        } catch (error: any) {
            console.error('Error en getCalendario:', error);
            res.status(500).json({ error: 'Error al obtener datos del calendario' });
        }
    },

    /**
     * PATCH /api/visitas/:id/cancelar
     * Cambia el estado de una visita a 'Cancelada' y registra el motivo en auditoría.
     * Errores conocidos:
     *  - 404: la visita no existe.
     *  - 409: la visita ya estaba cancelada.
     */
    async cancelarVisita(req: AuthRequest, res: Response) {
        try {
            const { id }    = req.params;
            const { motivo } = req.body;
            const usuarioId  = req.usuario.id;

            const visita = await VisitaService.cancelarVisita(String(id), usuarioId, motivo);
            res.status(200).json({ mensaje: 'Visita cancelada exitosamente', visita });
        } catch (error: any) {
            // Mapeo de errores de negocio a códigos HTTP semánticos
            const status =
                error.message === 'Visita no encontrada'               ? 404 :
                error.message === 'La visita ya se encuentra cancelada' ? 409 : 500;
            res.status(status).json({ error: error.message });
        }
    },

    /**
     * GET /api/visitas/:id
     * Devuelve el detalle completo de una visita (con gestor, grupo e institución).
     * Retorna 404 si la visita no existe.
     */
    async getById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const visita = await VisitaService.obtenerPorId(String(id));
            res.status(200).json(visita);
        } catch (error: any) {
            res.status(404).json({ error: error.message });
        }
    },

    /**
     * PUT /api/visitas/:id
     * Edita los datos de una visita existente (fecha, hora, estado, gestor, institución, etc.).
     * Solo valida el estado en el controller; el resto de validaciones las hace el service.
     */
    async updateVisita(req: AuthRequest, res: Response) {
        try {
            const { id }            = req.params;
            const datosAActualizar  = req.body;
            const usuarioId         = req.usuario.id;

            // Validación rápida del estado antes de llamar al service
            if (datosAActualizar.estado !== undefined && !esEstadoVisitaValido(datosAActualizar.estado)) {
                return res.status(400).json({
                    error: `Estado inválido. Valores permitidos: ${ESTADOS_VISITA.join(', ')}`,
                });
            }

            const visita = await VisitaService.modificarVisita(String(id), datosAActualizar, usuarioId);
            res.status(200).json({ mensaje: 'Visita modificada exitosamente', visita });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    },
};