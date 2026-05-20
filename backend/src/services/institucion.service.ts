import { InstitucionRepository } from '../repositories/institucion.repository';

export const InstitucionService = {
    async obtenerTodas() {
        return await InstitucionRepository.findAll();
    },

    async obtenerPorId(id: string) {
        const inst = await InstitucionRepository.findById(id);
        if (!inst) throw new Error('Institución no encontrada');
        return inst;
    },

    async crearInstitucion(datos: any) {
        if (!datos.nombre) {
            throw new Error('El nombre de la institución es obligatorio');
        }
        return await InstitucionRepository.create(datos);
    }
};
