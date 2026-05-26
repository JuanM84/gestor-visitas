"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstitucionController = void 0;
const institucion_service_1 = require("../services/institucion.service");
exports.InstitucionController = {
    async getInstituciones(req, res) {
        try {
            const instituciones = await institucion_service_1.InstitucionService.obtenerTodas();
            res.status(200).json(instituciones);
        }
        catch (error) {
            res.status(500).json({ error: 'Error al obtener las instituciones' });
        }
    },
    async createInstitucion(req, res) {
        try {
            const nueva = await institucion_service_1.InstitucionService.crearInstitucion(req.body);
            res.status(201).json({ mensaje: 'Institución creada exitosamente', institucion: nueva });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
};
