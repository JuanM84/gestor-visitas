"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiaInhabilController = void 0;
const diaInhabil_service_1 = require("../services/diaInhabil.service");
exports.DiaInhabilController = {
    async getDias(req, res) {
        try {
            const dias = await diaInhabil_service_1.DiaInhabilService.obtenerTodos();
            res.status(200).json(dias);
        }
        catch (error) {
            res.status(500).json({ error: 'Error al obtener días inhábiles' });
        }
    },
    async addDia(req, res) {
        try {
            const { fecha, descripcion } = req.body;
            if (!fecha || !descripcion) {
                return res.status(400).json({ error: 'La fecha y descripción son obligatorias' });
            }
            const nuevoDia = await diaInhabil_service_1.DiaInhabilService.agregar(fecha, descripcion);
            res.status(201).json(nuevoDia);
        }
        catch (error) {
            res.status(500).json({ error: 'Error al registrar el día inhábil' });
        }
    },
    async deleteDia(req, res) {
        try {
            const { id } = req.params;
            await diaInhabil_service_1.DiaInhabilService.eliminar(String(id));
            res.status(204).send();
        }
        catch (error) {
            res.status(500).json({ error: 'Error al eliminar el día inhábil' });
        }
    }
};
