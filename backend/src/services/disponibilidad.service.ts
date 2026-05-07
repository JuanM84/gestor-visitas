import { DisponibilidadRepository } from '../repositories/disponibilidad.repository';

export const AvailabilityService = {
    async validarDisponibilidad(fecha: string, hora_inicio: string, cantidadPersonas: number, visitaIdAExcluir?: string) {

        // 1. Control de Aforo Máximo
        const capacidadMaxima = await DisponibilidadRepository.obtenerCapacidadMaxima();
        if (cantidadPersonas > capacidadMaxima) {
            throw new Error(`La cantidad de personas (${cantidadPersonas}) supera el máximo permitido actualmente (${capacidadMaxima}).`);
        }

        // 2. Validación de Día Hábil
        const esInhabil = await DisponibilidadRepository.esDiaInhabil(fecha);
        if (esInhabil) {
            throw new Error('La fecha seleccionada es un día inhábil. No se pueden agendar visitas.');
        }

        // 3. Control de Solapamiento
        // AQUÍ: Pasamos el visitaIdAExcluir al repositorio
        const estaOcupado = await DisponibilidadRepository.existeSolapamiento(fecha, hora_inicio, visitaIdAExcluir);
        if (estaOcupado) {
            throw new Error(`El horario de las ${hora_inicio} el día ${fecha} ya se encuentra ocupado o bloqueado por un descanso.`);
        }
    }
};