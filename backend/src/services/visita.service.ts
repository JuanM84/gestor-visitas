import { VisitaRepository } from '../repositories/visita.repository';
import { AvailabilityService } from './disponibilidad.service';
import { pool } from '../config/db';
import { esTipoVisitaValido, TIPOS_VISITA, esEstadoVisitaValido, ESTADOS_VISITA } from '../types/visita.types';

// ── DTOs ─────────────────────────────────────────────────────────────────────

interface NuevoGestorDto {
    nombre: string;
    empresa_institucion?: string;
    telefono?: string;
    email?: string;
    localidad?: string;
    provincia?: string;
    pais?: string;
}

interface NuevaInstitucionDto {
    nombre: string;
    telefono?: string;
    email?: string;
    localidad?: string;
    provincia?: string;
    pais?: string;
}

interface GrupoInstitucionDto {
    tipo_visitante: 'Institución';
    nivel_educativo: string;
    institucion_id?: string;
    nuevaInstitucion?: NuevaInstitucionDto;
    observaciones?: string;
}

interface GrupoParticularesDto {
    tipo_visitante: 'Particulares';
    tipo_grupo: 'Menores' | 'Adultos' | 'Mixto';
    nombre: string;
    telefono: string;
    email: string;
    localidad: string;
    provincia: string;
    pais?: string;
    observaciones?: string;
}

type GrupoDto = GrupoInstitucionDto | GrupoParticularesDto;

interface VisitaDto {
    fecha: string;
    hora_inicio: string;
    tipo: string;
    tiene_cruce_tunel?: boolean;
    cantidad_personas: string | number;
    tiene_discapacidad?: boolean;
    discapacidad_detalle?: string;
}

interface CrearVisitaDto {
    gestor_id?: string;
    nuevoGestor?: NuevoGestorDto;
    grupo: GrupoDto;
    visita: VisitaDto;
}

interface ModificarVisitaDto {
    fecha?: string;
    hora_inicio?: string;
    cantidad_personas?: number;
    estado?: string;
    tipo?: string;
    tiene_cruce_tunel?: boolean;
    tiene_discapacidad?: boolean;
    discapacidad_detalle?: string;
}

// ── Constantes ────────────────────────────────────────────────────────────────

const NIVELES_EDUCATIVOS = ['Infantes', 'Primario', 'Secundario', 'Terciario', 'Universitario', 'Adultos Mayores'];
const TIPOS_GRUPO = ['Menores', 'Adultos', 'Mixto'];

// ── Servicio ─────────────────────────────────────────────────────────────────

export const VisitaService = {
    async obtenerVisitasDelDia(fecha: string) {
        if (!fecha.match(/^\d{4}-\d{2}-\d{2}$/)) {
            throw new Error('Formato de fecha inválido. Use YYYY-MM-DD');
        }
        return await VisitaRepository.findVisitasByFecha(fecha);
    },

    async registrarNuevaVisita(datos: CrearVisitaDto, usuarioId: string) {
        // 1. Validar tipo de visita
        if (!datos.visita?.tipo || !esTipoVisitaValido(datos.visita.tipo)) {
            throw new Error(`Tipo de visita inválido. Los valores permitidos son: ${TIPOS_VISITA.join(', ')}`);
        }

        // 2. Validar cantidad de personas
        const cantidadPersonas = parseInt(String(datos.visita.cantidad_personas), 10);
        if (isNaN(cantidadPersonas) || cantidadPersonas <= 0) {
            throw new Error('La cantidad de personas debe ser un número mayor a cero');
        }

        // 3. Validar tipo de visitante
        const tipoVisitante = datos.grupo?.tipo_visitante;
        if (!tipoVisitante || !['Institución', 'Particulares'].includes(tipoVisitante)) {
            throw new Error('El tipo de visitante debe ser "Institución" o "Particulares"');
        }

        // 4. Validaciones específicas por tipo
        if (tipoVisitante === 'Institución') {
            const g = datos.grupo as GrupoInstitucionDto;
            if (!g.nivel_educativo || !NIVELES_EDUCATIVOS.includes(g.nivel_educativo)) {
                throw new Error(`Nivel educativo inválido. Valores permitidos: ${NIVELES_EDUCATIVOS.join(', ')}`);
            }
            if (!g.institucion_id && !g.nuevaInstitucion?.nombre) {
                throw new Error('Debe seleccionar una institución existente o ingresar el nombre de la nueva institución');
            }
        }

        if (tipoVisitante === 'Particulares') {
            const g = datos.grupo as GrupoParticularesDto;
            if (!g.tipo_grupo || !TIPOS_GRUPO.includes(g.tipo_grupo)) {
                throw new Error('El tipo de grupo debe ser "Menores" o "Adultos"');
            }
            if (!g.nombre) throw new Error('El nombre del grupo es obligatorio para particulares');
            if (!g.telefono) throw new Error('El teléfono de contacto es obligatorio');
            if (!g.email) throw new Error('El email de contacto es obligatorio');
            if (!g.localidad) throw new Error('La localidad es obligatoria');
            if (!g.provincia) throw new Error('La provincia es obligatoria');
        }

        // 5. Validar disponibilidad (aforo + día hábil + solapamiento)
        await AvailabilityService.validarDisponibilidad(
            datos.visita.fecha,
            datos.visita.hora_inicio,
            cantidadPersonas
        );

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // — Gestor —
            let gestorId = datos.gestor_id;
            if (!gestorId && datos.nuevoGestor) {
                const ng = datos.nuevoGestor;
                const resGestor = await client.query(
                    `INSERT INTO Gestor (nombre, empresa_institucion, telefono, email, localidad, provincia, pais) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
                    [
                        ng.nombre,
                        ng.empresa_institucion || null,
                        ng.telefono || null,
                        ng.email || null,
                        ng.localidad || null,
                        ng.provincia || null,
                        ng.pais || 'Argentina'
                    ]
                );
                gestorId = resGestor.rows[0].id;
            }
            if (!gestorId) throw new Error('Debe seleccionar o crear un gestor');

            // — Institución (si aplica) —
            let institucionId: string | null = null;
            let nombreInstitucionResuelta: string | null = null;

            if (tipoVisitante === 'Institución') {
                const g = datos.grupo as GrupoInstitucionDto;
                if (!g.institucion_id && g.nuevaInstitucion) {
                    // Crear nueva institución
                    const ni = g.nuevaInstitucion;
                    const resInst = await client.query(
                        `INSERT INTO Institucion (nombre, telefono, email, localidad, provincia, pais)
                         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, nombre`,
                        [ni.nombre, ni.telefono || null, ni.email || null, ni.localidad || null, ni.provincia || null, ni.pais || 'Argentina']
                    );
                    institucionId = resInst.rows[0].id;
                    nombreInstitucionResuelta = resInst.rows[0].nombre;
                } else if (g.institucion_id) {
                    // Obtener nombre de institución existente
                    const resInst = await client.query('SELECT nombre FROM Institucion WHERE id = $1', [g.institucion_id]);
                    institucionId = g.institucion_id;
                    nombreInstitucionResuelta = resInst.rows[0]?.nombre || null;
                }
                if (!institucionId) throw new Error('Debe seleccionar o crear una institución');
            }

            // — Grupo —
            const g = datos.grupo;
            // Para instituciones: nombre = nombre de la institución. Para particulares: nombre ingresado.
            const nombreGrupo = tipoVisitante === 'Institución'
                ? nombreInstitucionResuelta
                : ((g as GrupoParticularesDto).nombre || null);

            const resGrupo = await client.query(
                `INSERT INTO Grupo (
                    nombre, tipo_visitante, nivel_educativo, tipo_grupo,
                    institucion_id, telefono, email, localidad, provincia, pais,
                    observaciones, gestor_id
                ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,
                [
                    nombreGrupo,
                    tipoVisitante,
                    tipoVisitante === 'Institución' ? (g as GrupoInstitucionDto).nivel_educativo : null,
                    tipoVisitante === 'Particulares' ? (g as GrupoParticularesDto).tipo_grupo : null,
                    institucionId,
                    tipoVisitante === 'Particulares' ? (g as GrupoParticularesDto).telefono : null,
                    tipoVisitante === 'Particulares' ? (g as GrupoParticularesDto).email : null,
                    tipoVisitante === 'Particulares' ? (g as GrupoParticularesDto).localidad : null,
                    tipoVisitante === 'Particulares' ? (g as GrupoParticularesDto).provincia : null,
                    tipoVisitante === 'Particulares' ? ((g as GrupoParticularesDto).pais || 'Argentina') : null,
                    g.observaciones || null,
                    gestorId
                ]
            );
            const grupoId = resGrupo.rows[0].id;

            // — Visita —
            const resVisita = await client.query(
                `INSERT INTO Visita (
                    gestor_id, usuario_registro_id, grupo_id,
                    fecha, hora_inicio, tipo, tiene_cruce_tunel,
                    cantidad_personas, tiene_discapacidad, discapacidad_detalle
                ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
                [
                    gestorId,
                    usuarioId,
                    grupoId,
                    datos.visita.fecha,
                    datos.visita.hora_inicio,
                    datos.visita.tipo,
                    datos.visita.tiene_cruce_tunel || false,
                    cantidadPersonas,
                    datos.visita.tiene_discapacidad || false,
                    datos.visita.discapacidad_detalle || null
                ]
            );

            // — Auditoría — (Usa el nombre resuelto correctamente en todos los casos)
            const nombreGrupoLog = tipoVisitante === 'Institución'
                ? (nombreInstitucionResuelta || 'Institución')
                : ((g as GrupoParticularesDto).nombre || 'Particulares');

            await client.query(
                `INSERT INTO LogAuditoria (usuario_id, accion) VALUES ($1, $2)`,
                [usuarioId, `Registró visita ID ${resVisita.rows[0].id} para "${nombreGrupoLog}"`]
            );

            await client.query('COMMIT');
            return resVisita.rows[0].id;

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },

    async obtenerHistorial(page = 1, pageSize = 50) {
        return await VisitaRepository.findHistorialCompleto(page, pageSize);
    },

    async obtenerDatosCalendario(anio: number, mes: number) {
        const registrosVisitas = await VisitaRepository.getAgrupadoPorMes(anio, mes);

        const queryInhabiles = `
            SELECT TO_CHAR(fecha, 'YYYY-MM-DD') as fecha_str, descripcion 
            FROM DiaInhabil
            WHERE EXTRACT(YEAR FROM fecha::date) = $1 AND EXTRACT(MONTH FROM fecha::date) = $2
        `;
        const resultInhabiles = await pool.query(queryInhabiles, [anio, mes]);
        const diasInhabiles = resultInhabiles.rows;

        const calendarioMensual: Record<number, any> = {};

        registrosVisitas.forEach((reg: any) => {
            const dia = parseInt(reg.fecha_str.split('-')[2], 10);
            const totalPersonas = parseInt(reg.total_personas, 10);
            let estado = 'parcial';
            let texto = 'Slots Disponibles';
            if (totalPersonas >= 300) { estado = 'lleno'; texto = 'Alta Ocupación'; }
            calendarioMensual[dia] = { visitas: totalPersonas, grupos: reg.total_grupos, estado, texto };
        });

        diasInhabiles.forEach((diaInhabil: any) => {
            const dia = parseInt(diaInhabil.fecha_str.split('-')[2], 10);
            calendarioMensual[dia] = { visitas: 0, grupos: 0, estado: 'inhabilitado', texto: diaInhabil.descripcion };
        });

        return calendarioMensual;
    },

    async cancelarVisita(id: string, usuarioId: string, motivo?: string) {
        const visitaActual = await VisitaRepository.getById(id);
        if (!visitaActual) throw new Error('Visita no encontrada');
        if (visitaActual.estado === 'Cancelada') throw new Error('La visita ya se encuentra cancelada');

        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const result = await client.query(
                `UPDATE Visita SET estado = 'Cancelada' WHERE id = $1 RETURNING id, fecha, hora_inicio, estado`,
                [id]
            );
            const visitaCancelada = result.rows[0];
            const fechaLimpia = visitaActual.fecha ? new Date(visitaActual.fecha).toLocaleDateString('es-AR') : id;
            const accion = motivo
                ? `Canceló visita del grupo "${visitaActual.grupo_nombre}" (${fechaLimpia}). Motivo: ${motivo}`
                : `Canceló visita del grupo "${visitaActual.grupo_nombre}" (${fechaLimpia})`;
            await client.query(`INSERT INTO LogAuditoria (usuario_id, accion) VALUES ($1, $2)`, [usuarioId, accion]);
            await client.query('COMMIT');
            return visitaCancelada;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },

    async obtenerPorId(id: string) {
        const visita = await VisitaRepository.getById(id);
        if (!visita) throw new Error('Visita no encontrada');
        return visita;
    },

    async modificarVisita(id: string, datos: ModificarVisitaDto, usuarioId: string) {
        const visitaActual = await VisitaRepository.getById(id);
        if (!visitaActual) throw new Error('Visita no encontrada');

        if (datos.tipo !== undefined && !esTipoVisitaValido(datos.tipo)) {
            throw new Error(`Tipo de visita inválido. Los valores permitidos son: ${TIPOS_VISITA.join(', ')}`);
        }
        if (datos.estado !== undefined && !esEstadoVisitaValido(datos.estado)) {
            throw new Error(`Estado inválido. Los valores permitidos son: ${ESTADOS_VISITA.join(', ')}`);
        }

        const nuevaFecha = datos.fecha ?? visitaActual.fecha.toISOString().split('T')[0];
        const nuevaHora = datos.hora_inicio ?? visitaActual.hora_inicio;
        const nuevaCantidad = datos.cantidad_personas ?? visitaActual.cantidad_personas;

        if (datos.fecha || datos.hora_inicio || datos.cantidad_personas) {
            await AvailabilityService.validarDisponibilidad(nuevaFecha, nuevaHora, nuevaCantidad, id);
        }

        const estadoCambio = datos.estado !== undefined && datos.estado !== visitaActual.estado;

        if (estadoCambio) {
            const client = await pool.connect();
            try {
                await client.query('BEGIN');
                const visitaActualizada = await VisitaRepository.updateVisita(id, datos);
                const fechaLimpia = visitaActual.fecha ? new Date(visitaActual.fecha).toLocaleDateString('es-AR') : id;
                const accion = `Cambió estado de visita del grupo "${visitaActual.grupo_nombre}" (${fechaLimpia}) de "${visitaActual.estado}" a "${datos.estado}"`;
                await client.query(`INSERT INTO LogAuditoria (usuario_id, accion) VALUES ($1, $2)`, [usuarioId, accion]);
                await client.query('COMMIT');
                return visitaActualizada;
            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            } finally {
                client.release();
            }
        }

        return await VisitaRepository.updateVisita(id, datos);
    }
};


export const VisitaService = {
    async obtenerVisitasDelDia(fecha: string) {
        if (!fecha.match(/^\d{4}-\d{2}-\d{2}$/)) {
            throw new Error('Formato de fecha inválido. Use YYYY-MM-DD');
        }
        return await VisitaRepository.findVisitasByFecha(fecha);
    },

    async registrarNuevaVisita(datos: any, usuarioId: string) {
        // 1. Validar tipo de visita
        if (!datos.visita?.tipo || !esTipoVisitaValido(datos.visita.tipo)) {
            throw new Error(`Tipo de visita inválido. Los valores permitidos son: ${TIPOS_VISITA.join(', ')}`);
        }

        // 2. Validar cantidad de personas
        const cantidadPersonas = parseInt(datos.visita.cantidad_personas, 10);
        if (isNaN(cantidadPersonas) || cantidadPersonas <= 0) {
            throw new Error('La cantidad de personas debe ser un número mayor a cero');
        }

        // 3. Validar tipo de visitante
        const tipoVisitante = datos.grupo?.tipo_visitante;
        if (!tipoVisitante || !['Institución', 'Particulares'].includes(tipoVisitante)) {
            throw new Error('El tipo de visitante debe ser "Institución" o "Particulares"');
        }

        // 4. Validaciones específicas por tipo
        if (tipoVisitante === 'Institución') {
            const nivelEducativo = datos.grupo?.nivel_educativo;
            if (!nivelEducativo || !NIVELES_EDUCATIVOS.includes(nivelEducativo)) {
                throw new Error(`Nivel educativo inválido. Valores permitidos: ${NIVELES_EDUCATIVOS.join(', ')}`);
            }
            if (!datos.grupo?.institucion_id && !datos.grupo?.nuevaInstitucion?.nombre) {
                throw new Error('Debe seleccionar una institución existente o ingresar el nombre de la nueva institución');
            }
        }

        if (tipoVisitante === 'Particulares') {
            const tipoGrupo = datos.grupo?.tipo_grupo;
            if (!tipoGrupo || !TIPOS_GRUPO.includes(tipoGrupo)) {
                throw new Error('El tipo de grupo debe ser "Menores" o "Adultos"');
            }
            if (!datos.grupo?.nombre) throw new Error('El nombre del grupo es obligatorio para particulares');
            if (!datos.grupo?.telefono) throw new Error('El teléfono de contacto es obligatorio');
            if (!datos.grupo?.email) throw new Error('El email de contacto es obligatorio');
            if (!datos.grupo?.localidad) throw new Error('La localidad es obligatoria');
            if (!datos.grupo?.provincia) throw new Error('La provincia es obligatoria');
        }

        // 5. Validar disponibilidad (aforo + día hábil + solapamiento)
        await AvailabilityService.validarDisponibilidad(
            datos.visita.fecha,
            datos.visita.hora_inicio,
            cantidadPersonas
        );

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // — Gestor —
            let gestorId = datos.gestor_id;
            if (!gestorId && datos.nuevoGestor) {
                const resGestor = await client.query(
                    `INSERT INTO Gestor (nombre, empresa_institucion, telefono, email, localidad, provincia, pais) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
                    [
                        datos.nuevoGestor.nombre,
                        datos.nuevoGestor.empresa_institucion || null,
                        datos.nuevoGestor.telefono || null,
                        datos.nuevoGestor.email || null,
                        datos.nuevoGestor.localidad || null,
                        datos.nuevoGestor.provincia || null,
                        datos.nuevoGestor.pais || 'Argentina'
                    ]
                );
                gestorId = resGestor.rows[0].id;
            }
            if (!gestorId) throw new Error('Debe seleccionar o crear un gestor');

            // — Institución (si aplica) —
            let institucionId = datos.grupo?.institucion_id || null;
            let nombreInstitucionResuelta: string | null = null;

            if (tipoVisitante === 'Institución') {
                if (!institucionId && datos.grupo?.nuevaInstitucion) {
                    // Crear nueva institución
                    const ni = datos.grupo.nuevaInstitucion;
                    const resInst = await client.query(
                        `INSERT INTO Institucion (nombre, telefono, email, localidad, provincia, pais)
                         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, nombre`,
                        [ni.nombre, ni.telefono || null, ni.email || null, ni.localidad || null, ni.provincia || null, ni.pais || 'Argentina']
                    );
                    institucionId = resInst.rows[0].id;
                    nombreInstitucionResuelta = resInst.rows[0].nombre;
                } else if (institucionId) {
                    // Obtener nombre de institución existente
                    const resInst = await client.query('SELECT nombre FROM Institucion WHERE id = $1', [institucionId]);
                    nombreInstitucionResuelta = resInst.rows[0]?.nombre || null;
                }
                if (!institucionId) throw new Error('Debe seleccionar o crear una institución');
            }

            // — Grupo —
            const g = datos.grupo;
            // Para instituciones: nombre = nombre de la institución. Para particulares: nombre ingresado.
            const nombreGrupo = tipoVisitante === 'Institución' ? nombreInstitucionResuelta : (g.nombre || null);

            const resGrupo = await client.query(
                `INSERT INTO Grupo (
                    nombre, tipo_visitante, nivel_educativo, tipo_grupo,
                    institucion_id, telefono, email, localidad, provincia, pais,
                    observaciones, gestor_id
                ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,
                [
                    nombreGrupo,
                    tipoVisitante,
                    tipoVisitante === 'Institución' ? g.nivel_educativo : null,
                    tipoVisitante === 'Particulares' ? g.tipo_grupo : null,
                    institucionId,
                    tipoVisitante === 'Particulares' ? g.telefono : null,
                    tipoVisitante === 'Particulares' ? g.email : null,
                    tipoVisitante === 'Particulares' ? g.localidad : null,
                    tipoVisitante === 'Particulares' ? g.provincia : null,
                    tipoVisitante === 'Particulares' ? (g.pais || 'Argentina') : null,
                    g.observaciones || null,
                    gestorId
                ]
            );
            const grupoId = resGrupo.rows[0].id;

            // — Visita —
            const resVisita = await client.query(
                `INSERT INTO Visita (
                    gestor_id, usuario_registro_id, grupo_id,
                    fecha, hora_inicio, tipo, tiene_cruce_tunel,
                    cantidad_personas, tiene_discapacidad, discapacidad_detalle
                ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
                [
                    gestorId,
                    usuarioId,
                    grupoId,
                    datos.visita.fecha,
                    datos.visita.hora_inicio,
                    datos.visita.tipo,
                    datos.visita.tiene_cruce_tunel || false,
                    cantidadPersonas,
                    datos.visita.tiene_discapacidad || false,
                    datos.visita.discapacidad_detalle || null
                ]
            );

            // — Auditoría —
            const nombreGrupoLog = tipoVisitante === 'Institución'
                ? (datos.grupo?.nuevaInstitucion?.nombre || 'Institución')
                : (g.nombre || 'Particulares');
            await client.query(
                `INSERT INTO LogAuditoria (usuario_id, accion) VALUES ($1, $2)`,
                [usuarioId, `Registró visita ID ${resVisita.rows[0].id} para "${nombreGrupoLog}"`]
            );

            await client.query('COMMIT');
            return resVisita.rows[0].id;

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
        const registrosVisitas = await VisitaRepository.getAgrupadoPorMes(anio, mes);

        const queryInhabiles = `
            SELECT TO_CHAR(fecha, 'YYYY-MM-DD') as fecha_str, descripcion 
            FROM DiaInhabil
            WHERE EXTRACT(YEAR FROM fecha::date) = $1 AND EXTRACT(MONTH FROM fecha::date) = $2
        `;
        const resultInhabiles = await pool.query(queryInhabiles, [anio, mes]);
        const diasInhabiles = resultInhabiles.rows;

        const calendarioMensual: Record<number, any> = {};

        registrosVisitas.forEach((reg: any) => {
            const dia = parseInt(reg.fecha_str.split('-')[2], 10);
            const totalPersonas = parseInt(reg.total_personas, 10);
            let estado = 'parcial';
            let texto = 'Slots Disponibles';
            if (totalPersonas >= 300) { estado = 'lleno'; texto = 'Alta Ocupación'; }
            calendarioMensual[dia] = { visitas: totalPersonas, grupos: reg.total_grupos, estado, texto };
        });

        diasInhabiles.forEach((diaInhabil: any) => {
            const dia = parseInt(diaInhabil.fecha_str.split('-')[2], 10);
            calendarioMensual[dia] = { visitas: 0, grupos: 0, estado: 'inhabilitado', texto: diaInhabil.descripcion };
        });

        return calendarioMensual;
    },

    async cancelarVisita(id: string, usuarioId: string, motivo?: string) {
        const visitaActual = await VisitaRepository.getById(id);
        if (!visitaActual) throw new Error('Visita no encontrada');
        if (visitaActual.estado === 'Cancelada') throw new Error('La visita ya se encuentra cancelada');

        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const result = await client.query(
                `UPDATE Visita SET estado = 'Cancelada' WHERE id = $1 RETURNING id, fecha, hora_inicio, estado`,
                [id]
            );
            const visitaCancelada = result.rows[0];
            const fechaLimpia = visitaActual.fecha ? new Date(visitaActual.fecha).toLocaleDateString('es-AR') : id;
            const accion = motivo
                ? `Canceló visita del grupo "${visitaActual.grupo_nombre}" (${fechaLimpia}). Motivo: ${motivo}`
                : `Canceló visita del grupo "${visitaActual.grupo_nombre}" (${fechaLimpia})`;
            await client.query(`INSERT INTO LogAuditoria (usuario_id, accion) VALUES ($1, $2)`, [usuarioId, accion]);
            await client.query('COMMIT');
            return visitaCancelada;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },

    async obtenerPorId(id: string) {
        const visita = await VisitaRepository.getById(id);
        if (!visita) throw new Error('Visita no encontrada');
        return visita;
    },

    async modificarVisita(id: string, datos: any, usuarioId: string) {
        const visitaActual = await VisitaRepository.getById(id);
        if (!visitaActual) throw new Error('Visita no encontrada');

        if (datos.tipo !== undefined && !esTipoVisitaValido(datos.tipo)) {
            throw new Error(`Tipo de visita inválido. Los valores permitidos son: ${TIPOS_VISITA.join(', ')}`);
        }
        if (datos.estado !== undefined && !esEstadoVisitaValido(datos.estado)) {
            throw new Error(`Estado inválido. Los valores permitidos son: ${ESTADOS_VISITA.join(', ')}`);
        }

        const nuevaFecha = datos.fecha ?? visitaActual.fecha.toISOString().split('T')[0];
        const nuevaHora = datos.hora_inicio ?? visitaActual.hora_inicio;
        const nuevaCantidad = datos.cantidad_personas ?? visitaActual.cantidad_personas;

        if (datos.fecha || datos.hora_inicio || datos.cantidad_personas) {
            await AvailabilityService.validarDisponibilidad(nuevaFecha, nuevaHora, nuevaCantidad, id);
        }

        const estadoCambio = datos.estado !== undefined && datos.estado !== visitaActual.estado;

        if (estadoCambio) {
            const client = await pool.connect();
            try {
                await client.query('BEGIN');
                const visitaActualizada = await VisitaRepository.updateVisita(id, datos);
                const fechaLimpia = visitaActual.fecha ? new Date(visitaActual.fecha).toLocaleDateString('es-AR') : id;
                const accion = `Cambió estado de visita del grupo "${visitaActual.grupo_nombre}" (${fechaLimpia}) de "${visitaActual.estado}" a "${datos.estado}"`;
                await client.query(`INSERT INTO LogAuditoria (usuario_id, accion) VALUES ($1, $2)`, [usuarioId, accion]);
                await client.query('COMMIT');
                return visitaActualizada;
            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            } finally {
                client.release();
            }
        }

        return await VisitaRepository.updateVisita(id, datos);
    }
};