// Tipos de visita permitidos en el sistema (debe coincidir con el backend)
export const TIPOS_VISITA = ['Salón de visitas', 'Salón + Sala de Comando'] as const;
export type TipoVisita = typeof TIPOS_VISITA[number];

export const esTipoVisitaValido = (tipo: string): tipo is TipoVisita =>
    TIPOS_VISITA.includes(tipo as TipoVisita);

// Estados de visita permitidos en el sistema (debe coincidir con el backend)
export const ESTADOS_VISITA = ['Agendada', 'Cancelada', 'Realizada'] as const;
export type EstadoVisita = typeof ESTADOS_VISITA[number];

// Colores de badge por estado — fuente única para todos los componentes
export const BADGE_ESTADO: Record<string, string> = {
    'Agendada':  'bg-sky-100 text-sky-800 border border-sky-200',
    'Realizada': 'bg-[#e6f4ea] text-[#137333] border border-[#a8d5b5]',
    'Cancelada': 'bg-red-100 text-red-700 border border-red-200',
};

export interface Gestor {
    id: string | number;
    nombre: string;
    tipo?: string;
    empresa_institucion?: string;
    telefono?: string;
    email?: string;
    localidad?: string;
    provincia?: string;
    pais?: string;
}

export interface Institucion {
    id: string | number;
    nombre: string;
    telefono?: string;
    email?: string;
    localidad?: string;
    provincia?: string;
    pais?: string;
}
