// Tipos de visita permitidos en el sistema
export const TIPOS_VISITA = ['Complejo', 'Complejo + Monitoreo'] as const;
export type TipoVisita = typeof TIPOS_VISITA[number];

export const esTipoVisitaValido = (tipo: string): tipo is TipoVisita =>
    TIPOS_VISITA.includes(tipo as TipoVisita);

// Estados de visita permitidos en el sistema
export const ESTADOS_VISITA = ['Agendada', 'Cancelada', 'Realizada'] as const;
export type EstadoVisita = typeof ESTADOS_VISITA[number];

export const esEstadoVisitaValido = (estado: string): estado is EstadoVisita =>
    ESTADOS_VISITA.includes(estado as EstadoVisita);
