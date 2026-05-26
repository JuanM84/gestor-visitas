"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.esEstadoVisitaValido = exports.ESTADOS_VISITA = exports.esTipoVisitaValido = exports.TIPOS_VISITA = void 0;
// Tipos de visita permitidos en el sistema
exports.TIPOS_VISITA = ['Salón de visitas', 'Salón + Sala de Comando'];
const esTipoVisitaValido = (tipo) => exports.TIPOS_VISITA.includes(tipo);
exports.esTipoVisitaValido = esTipoVisitaValido;
// Estados de visita permitidos en el sistema
exports.ESTADOS_VISITA = ['Agendada', 'Cancelada', 'Realizada'];
const esEstadoVisitaValido = (estado) => exports.ESTADOS_VISITA.includes(estado);
exports.esEstadoVisitaValido = esEstadoVisitaValido;
