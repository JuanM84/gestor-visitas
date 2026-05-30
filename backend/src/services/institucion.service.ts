import { InstitucionRepository } from '../repositories/institucion.repository';
import { pool } from '../config/db';

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
        if (!datos.nombre?.trim()) {
            throw new Error('El nombre de la institución es obligatorio');
        }

        // G-7: Detectar institución duplicada por nombre
        const duplicado = await pool.query(
            `SELECT id FROM Institucion WHERE LOWER(TRIM(nombre)) = LOWER(TRIM($1))`,
            [datos.nombre]
        );
        if (duplicado.rows.length > 0) {
            throw new Error(`Ya existe una institución con el nombre "${datos.nombre.trim()}"`);
        }

        return await InstitucionRepository.create(datos);
    }
};
