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
    async registrarNuevaVisita(datos: any, usuarioId: string) {
        // 1. Validamos que la cantidad de personas sea un número válido
        const cantidadPersonas = parseInt(datos.visita.cantidad_personas, 10);
        if (isNaN(cantidadPersonas) || cantidadPersonas <= 0) {
            throw new Error('La cantidad de personas debe ser un número mayor a cero');
        }

        // 2. VALIDACIÓN DE DISPONIBILIDAD (Aforo y Días Inhábiles)
        await AvailabilityService.validarDisponibilidad(
            datos.visita.fecha,
            datos.visita.hora_inicio,
            cantidadPersonas
        );

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            let gestorId = datos.gestor_id;

            if (!gestorId && datos.nuevoGestor) {
                const resGestor = await client.query(
                    `INSERT INTO Gestor (nombre, tipo, telefono, email, localidad, provincia, pais) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
                    [
                        datos.nuevoGestor.nombre,
                        datos.nuevoGestor.tipo,
                        datos.nuevoGestor.telefono,
                        datos.nuevoGestor.email,
                        datos.nuevoGestor.localidad,
                        datos.nuevoGestor.provincia,
                        datos.nuevoGestor.pais
                    ]
                );
                gestorId = resGestor.rows[0].id;
            }

            const resGrupo = await client.query(
                `INSERT INTO Grupo (nombre, tipo, nivel_educativo, descripcion, gestor_id) 
                 VALUES ($1, $2, $3, $4, $5) RETURNING id`,
                [
                    datos.grupo.nombre,
                    datos.grupo.tipo,
                    datos.grupo.nivel_educativo,
                    datos.grupo.descripcion,
                    gestorId
                ]
            );
            const grupoId = resGrupo.rows[0].id;

            const resVisita = await client.query(
                `INSERT INTO Visita (
                    gestor_id, usuario_registro_id, grupo_id, 
                    fecha, hora_inicio, tipo, tiene_cruce_tunel, cantidad_personas, tiene_discapacidad, discapacidad_detalle
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
                [
                    gestorId,
                    usuarioId,
                    grupoId,
                    datos.visita.fecha,
                    datos.visita.hora_inicio,
                    datos.visita.tipo,
                    datos.visita.tiene_cruce_tunel,
                    cantidadPersonas,
                    datos.visita.tiene_discapacidad || false,
                    datos.visita.discapacidad_detalle || null
                ]
            );

            await client.query(
                `INSERT INTO LogAuditoria (usuario_id, accion) VALUES ($1, $2)`,
                [usuarioId, `Registró visita ID ${resVisita.rows[0].id} para el grupo ${datos.grupo.nombre}`]
            );

            await client.query('COMMIT');
            return resVisita.rows[0];

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
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
            FROM DiaInhabil
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