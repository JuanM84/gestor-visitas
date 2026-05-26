"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VisitaController = void 0;
const visita_service_1 = require("../services/visita.service");
const visita_types_1 = require("../types/visita.types");
exports.VisitaController = {
    async getVisitasDashboard(req, res) {
        try {
            const fecha = req.query.fecha || new Date().toISOString().split('T')[0];
            if (!fecha) {
                return res.status(400).json({ error: 'El parámetro fecha es requerido' });
            }
            const visitas = await visita_service_1.VisitaService.obtenerVisitasDelDia(fecha);
            res.status(200).json({
                fecha,
                total: visitas.length,
                data: visitas
            });
        }
        catch (error) {
            console.error('Error en getVisitasDashboard:', error.message);
            res.status(500).json({ error: error.message || 'Error interno del servidor' });
        }
    },
    async crearVisita(req, res) {
        try {
            const datosVisita = req.body;
            // Validación temprana del tipo de visita
            const tipo = datosVisita?.visita?.tipo;
            if (!tipo || !(0, visita_types_1.esTipoVisitaValido)(tipo)) {
                return res.status(400).json({
                    error: `El tipo de visita es inválido o está ausente. Valores permitidos: ${visita_types_1.TIPOS_VISITA.join(', ')}`
                });
            }
            const nuevaVisitaId = await visita_service_1.VisitaService.registrarNuevaVisita(datosVisita, req.usuario.id);
            res.status(201).json({
                mensaje: 'Visita registrada con éxito',
                visita_id: nuevaVisitaId
            });
        }
        catch (error) {
            console.error('Error en crearVisita:', error.message, error.detail || '', error.constraint || '');
            res.status(400).json({ error: error.message || 'Error al procesar la solicitud' });
        }
    },
    async getHistorial(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const pageSize = parseInt(req.query.pageSize) || 50;
            const historial = await visita_service_1.VisitaService.obtenerHistorial(page, pageSize);
            res.status(200).json(historial);
        }
        catch (error) {
            res.status(500).json({ error: 'Error al obtener el historial de visitas' });
        }
    },
    async getCalendario(req, res) {
        try {
            const anio = parseInt(req.query.anio) || new Date().getFullYear();
            const mes = parseInt(req.query.mes) || (new Date().getMonth() + 1);
            const datos = await visita_service_1.VisitaService.obtenerDatosCalendario(anio, mes);
            res.status(200).json(datos);
        }
        catch (error) {
            console.error('ERROR REAL EN CALENDARIO:', error);
            res.status(500).json({ error: 'Error al obtener datos del calendario' });
        }
    },
    async cancelarVisita(req, res) {
        try {
            const { id } = req.params;
            const { motivo } = req.body;
            const usuarioId = req.usuario.id;
            const visita = await visita_service_1.VisitaService.cancelarVisita(String(id), usuarioId, motivo);
            res.status(200).json({ mensaje: 'Visita cancelada exitosamente', visita });
        }
        catch (error) {
            const isNotFound = error.message === 'Visita no encontrada';
            res.status(isNotFound ? 404 : 500).json({ error: error.message });
        }
    },
    async getById(req, res) {
        try {
            const { id } = req.params;
            const visita = await visita_service_1.VisitaService.obtenerPorId(String(id));
            res.status(200).json(visita);
        }
        catch (error) {
            res.status(404).json({ error: error.message });
        }
    },
    async updateVisita(req, res) {
        try {
            const { id } = req.params;
            const datosAActualizar = req.body;
            const usuarioId = req.usuario.id;
            // Validación del tipo si viene en el payload
            if (datosAActualizar.tipo !== undefined && !(0, visita_types_1.esTipoVisitaValido)(datosAActualizar.tipo)) {
                return res.status(400).json({
                    error: `Tipo de visita inválido. Valores permitidos: ${visita_types_1.TIPOS_VISITA.join(', ')}`
                });
            }
            // Validación del estado si viene en el payload
            if (datosAActualizar.estado !== undefined && !(0, visita_types_1.esEstadoVisitaValido)(datosAActualizar.estado)) {
                return res.status(400).json({
                    error: `Estado inválido. Valores permitidos: ${visita_types_1.ESTADOS_VISITA.join(', ')}`
                });
            }
            const visita = await visita_service_1.VisitaService.modificarVisita(String(id), datosAActualizar, usuarioId);
            res.status(200).json({ mensaje: 'Visita modificada exitosamente', visita });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
};
