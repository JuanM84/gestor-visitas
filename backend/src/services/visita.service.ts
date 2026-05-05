import { VisitaRepository } from '../repositories/visita.repository';
import { AvailabilityService } from './disponibilidad.service';
import { pool } from '../config/db';

export const VisitaService = {
    async obtenerVisitasDelDia(fecha: string) {
        // Validación básica de la fecha (puedes usar librerías como date-fns o moment después)
        if (!fecha.match(/^\d{4}-\d{2}-\d{2}$/)) {
            throw new Error('Formato de fecha inválido. Use YYYY-MM-DD');
        }

        const visitas = await VisitaRepository.findVisitasByFecha(fecha);

        // Aquí podríamos formatear la salida
        return visitas;
    },
    async registrarNuevaVisita(datosVisita: any) {
        if (!datosVisita.usuario_registro_id) {
            throw new Error('Se requiere el ID del usuario que registra la visita.');
        }

        // Validamos disponibilidad
        await AvailabilityService.validarDisponibilidad(
            datosVisita.visita.fecha,
            datosVisita.visita.hora_inicio,
            datosVisita.visita.cantidad_personas
        );
        // ---------------------------------------------

        const nuevaVisitaId = await VisitaRepository.crearVisitaTransaccional(datosVisita);

        return nuevaVisitaId;
    },
    async obtenerHistorial() {
        return await VisitaRepository.findHistorialCompleto();
    },
    async obtenerDatosCalendario(anio: number, mes: number) {
        // 1. Buscamos las visitas agrupadas (lo que ya teníamos)
        const registrosVisitas = await VisitaRepository.getAgrupadoPorMes(anio, mes);

        // 2. NUEVO: Buscamos los días inhábiles de este mes específico
        const queryInhabiles = `
      SELECT TO_CHAR(fecha, 'YYYY-MM-DD') as fecha_str, descripcion 
      FROM Dialnhabil 
      WHERE EXTRACT(YEAR FROM fecha::date) = $1 AND EXTRACT(MONTH FROM fecha::date) = $2
    `;
        const resultInhabiles = await pool.query(queryInhabiles, [anio, mes]);
        const diasInhabiles = resultInhabiles.rows;

        // 3. Preparamos el diccionario para React
        const calendarioMensual: Record<number, any> = {};

        // 4. Llenamos los días que tienen visitas
        registrosVisitas.forEach((reg: any) => {
            const dia = parseInt(reg.fecha_str.split('-')[2], 10);
            const totalPersonas = parseInt(reg.total_personas, 10);

            let estado = 'parcial';
            let texto = 'Slots Disponibles';

            if (totalPersonas >= 300) {
                estado = 'lleno';
                texto = 'Alta Ocupación';
            }

            calendarioMensual[dia] = {
                visitas: totalPersonas,
                grupos: reg.total_grupos,
                estado: estado,
                texto: texto
            };
        });

        // 5. NUEVO: Sobrescribimos o agregamos los días inhábiles al calendario[cite: 1]
        diasInhabiles.forEach((diaInhabil: any) => {
            const dia = parseInt(diaInhabil.fecha_str.split('-')[2], 10);

            // Si el día está bloqueado, "pisa" cualquier visita que pudiera haber y lo marca gris
            calendarioMensual[dia] = {
                visitas: 0,
                grupos: 0,
                estado: 'inhabilitado',
                texto: diaInhabil.descripcion // Ej: "Feriado Nacional"
            };
        });

        return calendarioMensual;
    },
    async cancelarVisita(id: string, motivo?: string) {
        // Acá en el futuro podrías agregar la lógica para guardar el 'motivo' en la tabla de Auditoría[cite: 1, 2].
        // Por ahora, procedemos a cambiar el estado.
        const visitaCancelada = await VisitaRepository.cancelarVisita(id);

        if (!visitaCancelada) {
            throw new Error('Visita no encontrada');
        }

        return visitaCancelada;
    },
    async obtenerPorId(id: string) {
        const visita = await VisitaRepository.getById(id);
        if (!visita) throw new Error('Visita no encontrada');
        return visita;
    },
    async modificarVisita(id: string, datos: any) {
        // Obtenemos la visita actual para comparar
        const visitaActual = await VisitaRepository.getById(id);
        if (!visitaActual) throw new Error('Visita no encontrada');

        // Si hay cambios en fecha, hora o cantidad de personas, re-evaluamos disponibilidad[cite: 2]
        const nuevaFecha = datos.fecha || visitaActual.fecha.toISOString().split('T')[0];
        const nuevaHora = datos.hora_inicio || visitaActual.hora_inicio;
        const nuevaCantidad = datos.cantidad_personas || visitaActual.cantidad_personas;

        // Solo validamos si realmente cambió algo que afecte el calendario
        if (datos.fecha || datos.hora_inicio || datos.cantidad_personas) {
            await AvailabilityService.validarDisponibilidad(nuevaFecha, nuevaHora, nuevaCantidad);
        }

        // Si pasa la validación (o si solo estaba cambiando el estado), guardamos los cambios
        const visitaActualizada = await VisitaRepository.updateVisita(id, datos);
        return visitaActualizada;
    }
};