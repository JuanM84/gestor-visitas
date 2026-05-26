"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstitucionService = void 0;
const institucion_repository_1 = require("../repositories/institucion.repository");
exports.InstitucionService = {
    async obtenerTodas() {
        return await institucion_repository_1.InstitucionRepository.findAll();
    },
    async obtenerPorId(id) {
        const inst = await institucion_repository_1.InstitucionRepository.findById(id);
        if (!inst)
            throw new Error('Institución no encontrada');
        return inst;
    },
    async crearInstitucion(datos) {
        if (!datos.nombre) {
            throw new Error('El nombre de la institución es obligatorio');
        }
        return await institucion_repository_1.InstitucionRepository.create(datos);
    }
};
