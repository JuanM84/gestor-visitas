"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GestorController = void 0;
const gestor_service_1 = require("../services/gestor.service");
const TIPOS_GESTOR_VALIDOS = [
    'Institución Educativa',
    'Agencia de Turismo',
    'Club / Asociación',
    'Particular / Organismo Público'
];
exports.GestorController = {
    async getGestores(req, res) {
        try {
            const gestores = await gestor_service_1.GestorService.obtenerTodos();
            res.status(200).json(gestores);
        }
        catch (error) {
            console.error('Error real de BD:', error);
            res.status(500).json({ error: 'Error al obtener los gestores' });
        }
    },
    async createGestor(req, res) {
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
            const nuevoGestor = await gestor_service_1.GestorService.crearGestor(req.body);
            res.status(201).json({ mensaje: 'Gestor creado exitosamente', gestor: nuevoGestor });
        }
        catch (error) {
            res.status(500).json({ error: 'Error al guardar el gestor' });
        }
    }
};
