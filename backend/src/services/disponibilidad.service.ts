/**
 * @file disponibilidad.service.ts
 * @description Servicio de validación de disponibilidad para nuevas visitas o ediciones.
 *
 * Aplica tres reglas de negocio en secuencia antes de permitir registrar/modificar una visita:
 *
 *  1. AFORO DIARIO: La suma total de personas en el día no puede superar `capacidad_maxima`.
 *  2. DÍA HÁBIL:   La fecha no puede estar marcada como inhábil en la tabla DiaInhabil.
 *  3. AFORO POR TURNO: La suma de personas en ese horario (fecha + hora_inicio) no puede
 *                       superar `capacidad_por_turno`. Esto permite múltiples grupos por turno.
 *
 * Si alguna regla falla, lanza un Error con un mensaje descriptivo que el controller
 * devuelve directamente al frontend.
 */

import { DisponibilidadRepository } from '../repositories/disponibilidad.repository';

export const AvailabilityService = {

    /**
     * Valida que una visita puede ser registrada o modificada sin violar las reglas de cupo.
     *
     * @param fecha              - Fecha de la visita en formato 'YYYY-MM-DD'.
     * @param hora_inicio        - Horario del turno en formato 'HH:MM' o 'HH:MM:SS'.
     * @param cantidadPersonas   - Número de personas de la nueva visita / grupo.
     * @param visitaIdAExcluir   - (Opcional) ID de la visita que se está editando.
     *                             Se excluye de los cómputos para no bloquearse a sí misma.
     * @throws Error si alguna de las tres validaciones falla.
     */
    async validarDisponibilidad(
        fecha: string,
        hora_inicio: string,
        cantidadPersonas: number,
        visitaIdAExcluir?: string
    ) {
        // ── Validación 1: Aforo Máximo Diario ────────────────────────────────
        // Suma todas las personas agendadas en el día (sin importar el horario)
        // y verifica que agregar este grupo no supere el límite diario global.
        const capacidadMaxima      = await DisponibilidadRepository.obtenerCapacidadMaxima();
        const personasYaAgendadas  = await DisponibilidadRepository.obtenerPersonasAgendadasEnFecha(fecha, visitaIdAExcluir);
        const totalConNuevaVisita  = personasYaAgendadas + cantidadPersonas;

        if (totalConNuevaVisita > capacidadMaxima) {
            const disponibles = Math.max(0, capacidadMaxima - personasYaAgendadas);
            throw new Error(
                `Aforo diario superado. Capacidad máxima: ${capacidadMaxima}. ` +
                `Ya agendadas: ${personasYaAgendadas}. Disponibles: ${disponibles}.`
            );
        }

        // ── Validación 2: Día Hábil ───────────────────────────────────────────
        // Consulta la tabla DiaInhabil. Si la fecha está bloqueada, se rechaza
        // sin importar cuánto cupo quede disponible.
        const esInhabil = await DisponibilidadRepository.esDiaInhabil(fecha);
        if (esInhabil) {
            throw new Error('La fecha seleccionada es un día inhábil. No se pueden agendar visitas.');
        }

        // ── Validación 3: Aforo por Turno ─────────────────────────────────────
        // A diferencia del sistema anterior (que bloqueaba el slot en cuanto había
        // UNA visita), ahora múltiples grupos pueden compartir el mismo horario.
        // Se rechaza solo cuando la suma de personas en ese turno supera el límite.
        const capacidadPorTurno  = await DisponibilidadRepository.obtenerCapacidadPorTurno();
        const personasEnEseTurno = await DisponibilidadRepository.obtenerPersonasPorTurno(fecha, hora_inicio, visitaIdAExcluir);
        const totalEnTurno       = personasEnEseTurno + cantidadPersonas;

        if (totalEnTurno > capacidadPorTurno) {
            const disponiblesEnTurno = Math.max(0, capacidadPorTurno - personasEnEseTurno);
            throw new Error(
                `Capacidad del turno ${hora_inicio} superada. Máximo por turno: ${capacidadPorTurno}. ` +
                `Ya agendadas en ese turno: ${personasEnEseTurno}. Disponibles: ${disponiblesEnTurno}.`
            );
        }
    },
};