"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AvailabilityService = void 0;
const disponibilidad_repository_1 = require("../repositories/disponibilidad.repository");
exports.AvailabilityService = {
    async validarDisponibilidad(fecha, hora_inicio, cantidadPersonas, visitaIdAExcluir) {
        // 1. Control de Aforo Máximo diario acumulado
        const capacidadMaxima = await disponibilidad_repository_1.DisponibilidadRepository.obtenerCapacidadMaxima();
        const personasYaAgendadas = await disponibilidad_repository_1.DisponibilidadRepository.obtenerPersonasAgendadasEnFecha(fecha, visitaIdAExcluir);
        const totalConNuevaVisita = personasYaAgendadas + cantidadPersonas;
        if (totalConNuevaVisita > capacidadMaxima) {
            const disponibles = capacidadMaxima - personasYaAgendadas;
            throw new Error(`Aforo diario superado. Capacidad máxima: ${capacidadMaxima}. ` +
                `Ya agendadas: ${personasYaAgendadas}. Disponibles: ${disponibles < 0 ? 0 : disponibles}.`);
        }
        // 2. Validación de Día Hábil
        const esInhabil = await disponibilidad_repository_1.DisponibilidadRepository.esDiaInhabil(fecha);
        if (esInhabil) {
            throw new Error('La fecha seleccionada es un día inhábil. No se pueden agendar visitas.');
        }
        // 3. Control de Solapamiento
        // AQUÍ: Pasamos el visitaIdAExcluir al repositorio
        const estaOcupado = await disponibilidad_repository_1.DisponibilidadRepository.existeSolapamiento(fecha, hora_inicio, visitaIdAExcluir);
        if (estaOcupado) {
            throw new Error(`El horario de las ${hora_inicio} el día ${fecha} ya se encuentra ocupado o bloqueado por un descanso.`);
        }
    }
};
