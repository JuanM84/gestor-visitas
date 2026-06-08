import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { cn } from '../utils/cn';
import { BADGE_ESTADO } from '../utils/visitaTypes';
import { useAuth } from '../context/AuthContext';

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatFecha = (fechaRaw: string) => {
    try {
        const limpia = fechaRaw.includes('T') ? fechaRaw.split('T')[0] : fechaRaw;
        const [year, month, day] = limpia.split('-');
        return `${parseInt(day)}/${parseInt(month)}/${year}`;
    } catch {
        return 'Fecha no disponible';
    }
};

// Fila de dato reutilizable
const Dato = ({ label, value, icon }: { label: string; value?: string | null; icon?: string }) => {
    if (!value) return null;
    return (
        <div>
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1 flex items-center gap-1">
                {icon && <span className="material-symbols-outlined text-[14px]">{icon}</span>}
                {label}
            </p>
            <p className="text-sm text-on-surface font-medium">{value}</p>
        </div>
    );
};

// Tarjeta de sección reutilizable
const Seccion = ({ titulo, icono, children, colSpan2 = false }: { titulo: string; icono: string; children: React.ReactNode; colSpan2?: boolean }) => (
    <div className={cn(
        "bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant space-y-5",
        colSpan2 && "md:col-span-2"
    )}>
        <div className="flex items-center gap-2 text-primary pb-3 border-b border-outline-variant">
            <span className="material-symbols-outlined text-[22px]">{icono}</span>
            <h2 className="font-bold text-base text-on-surface">{titulo}</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            {children}
        </div>
    </div>
);

// ── Componente principal ──────────────────────────────────────────────────────

export const DetalleVisita = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token } = useAuth();
    const [visita, setVisita] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [cancelando, setCancelando] = useState(false);

    useEffect(() => {
        const fetchDetalle = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/visitas/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('No se pudo cargar el detalle de la visita');
                setVisita(await response.json());
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchDetalle();
    }, [id, token]);

    const handleCancelar = async () => {
        const motivo = window.prompt('¿Está seguro de cancelar esta visita? Ingrese un motivo (opcional):');
        if (motivo === null) return;

        setCancelando(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/visitas/${id}/cancelar`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ motivo })
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Error al cancelar la visita');
            }
            setVisita((prev: any) => ({ ...prev, estado: 'Cancelada' }));
        } catch (err: any) {
            alert(`No se pudo cancelar: ${err.message}`);
        } finally {
            setCancelando(false);
        }
    };

    const [imprimiendo, setImprimiendo] = useState(false);

    const handleReimprimir = async () => {
        setImprimiendo(true);
        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/estadisticas/exportar/visita/${id}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            if (!res.ok) throw new Error('Error al generar el comprobante PDF');
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Comprobante_Visita_${id}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Error al reimprimir comprobante:', err);
            alert('No se pudo generar el comprobante de visita.');
        } finally {
            setImprimiendo(false);
        }
    };


    if (loading) return <div className="p-8 text-center text-on-surface-variant animate-pulse">Cargando detalles...</div>;
    if (error || !visita) return <div className="p-8 text-center text-error">{error || 'Visita no encontrada'}</div>;

    const esInstitucion = visita.tipo_visitante === 'Institución';
    const esParticulares = visita.tipo_visitante === 'Particulares';

    // Label del tipo de grupo para particulares
    const tipoGrupoLabel: Record<string, { icono: string; color: string }> = {
        'Menores':  { icono: 'child_care', color: 'text-blue-600 bg-blue-50 border-blue-200' },
        'Adultos':  { icono: 'person',     color: 'text-green-700 bg-green-50 border-green-200' },
        'Mixto':    { icono: 'people',     color: 'text-purple-700 bg-purple-50 border-purple-200' },
    };
    const tipoGrupoBadge = visita.tipo_grupo ? tipoGrupoLabel[visita.tipo_grupo] : null;

    return (
        <div className="flex flex-col max-w-[1000px] w-full mx-auto pb-12">

            {/* ── Encabezado ── */}
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-surface-container rounded-full transition-colors">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <div>
                    <h1 className="font-h1 text-h1 text-on-surface">Detalle de la Reserva</h1>
                    <p className="font-body-md text-on-surface-variant">Gestión y control de la visita programada.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                {/* ── 1. Resumen principal ── */}
                <div className="md:col-span-2 bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant">
                    <div className="flex justify-between items-start flex-wrap gap-4">
                        <div className="flex gap-5 items-center">
                            <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg border border-primary/20 shrink-0">
                                {visita.hora_inicio?.slice(0, 5)}
                            </div>
                            <div>
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                    <h2 className="text-2xl font-black text-on-surface">{visita.grupo_nombre}</h2>
                                    <span className={cn(
                                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                                        BADGE_ESTADO[visita.estado] ?? 'bg-surface-container text-outline border border-outline-variant'
                                    )}>
                                        {visita.estado}
                                    </span>
                                    {/* Badge tipo visitante */}
                                    <span className={cn(
                                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border",
                                        esInstitucion
                                            ? 'bg-sky-50 text-sky-700 border-sky-200'
                                            : 'bg-amber-50 text-amber-700 border-amber-200'
                                    )}>
                                        <span className="material-symbols-outlined text-[11px] align-[-1px] mr-0.5">
                                            {esInstitucion ? 'school' : 'group'}
                                        </span>
                                        {visita.tipo_visitante}
                                    </span>
                                </div>
                                <p className="text-base text-on-surface-variant font-medium flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[18px]">manage_accounts</span>
                                    Gestor: <span className="font-semibold text-on-surface ml-1">{visita.gestor_nombre}</span>
                                </p>
                            </div>
                        </div>

                        {/* Personas destacado */}
                        <div className="bg-primary/5 px-6 py-3 rounded-2xl border border-primary/20 text-center">
                            <p className="text-3xl font-black text-primary leading-none">{visita.cantidad_personas}</p>
                            <p className="text-[10px] font-bold uppercase text-outline mt-1 tracking-tighter">Personas</p>
                        </div>
                    </div>
                </div>

                {/* ── 2. Agenda y turno ── */}
                <Seccion titulo="Agenda y Turno" icono="calendar_month">
                    <Dato label="Fecha" value={formatFecha(visita.fecha)} icon="event" />
                    <Dato label="Hora de inicio" value={visita.hora_inicio?.slice(0, 5) + ' hs'} icon="schedule" />
                    <Dato label="Tipo de visita" value={visita.tipo} icon="confirmation_number" />
                    <div className="sm:col-span-2 flex flex-wrap gap-3 pt-1">
                        <div className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold",
                            visita.tiene_cruce_tunel
                                ? "bg-green-50 text-green-700 border-green-200"
                                : "bg-surface-container text-outline border-outline-variant"
                        )}>
                            <span className="material-symbols-outlined text-[18px]">
                                {visita.tiene_cruce_tunel ? 'check_circle' : 'cancel'}
                            </span>
                            {visita.tiene_cruce_tunel ? 'Realiza cruce del túnel' : 'Sin cruce del túnel'}
                        </div>
                        <div className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold",
                            visita.tiene_discapacidad
                                ? "bg-secondary/5 text-secondary border-secondary/30"
                                : "bg-surface-container text-outline border-outline-variant"
                        )}>
                            <span className="material-symbols-outlined text-[18px]">
                                {visita.tiene_discapacidad ? 'accessible_forward' : 'accessibility_new'}
                            </span>
                            {visita.tiene_discapacidad ? 'Requiere accesibilidad' : 'Sin requerimientos especiales'}
                        </div>
                    </div>
                </Seccion>

                {/* ── 3. Gestor ── */}
                <Seccion titulo="Gestor Responsable" icono="manage_accounts">
                    <Dato label="Nombre" value={visita.gestor_nombre} icon="person" />
                    <Dato label="Empresa / Institución" value={visita.gestor_empresa} icon="domain" />
                    <Dato label="Teléfono" value={visita.gestor_telefono} icon="call" />
                    <Dato label="Email" value={visita.gestor_email} icon="mail" />
                </Seccion>

                {/* ── 4a. Institución (si aplica) ── */}
                {esInstitucion && (
                    <Seccion titulo="Institución Educativa" icono="school" colSpan2>
                        <Dato label="Nombre" value={visita.institucion_nombre || visita.grupo_nombre} icon="school" />
                        <Dato label="Nivel educativo" value={visita.nivel_educativo} icon="menu_book" />
                        <Dato label="Teléfono" value={visita.institucion_telefono} icon="call" />
                        <Dato label="Email institucional" value={visita.institucion_email} icon="mail" />
                        <Dato label="Localidad" value={visita.institucion_localidad} icon="location_on" />
                        <Dato label="Provincia" value={visita.institucion_provincia} icon="map" />
                        <Dato label="País" value={visita.institucion_pais || 'Argentina'} icon="public" />
                    </Seccion>
                )}

                {/* ── 4b. Particulares (si aplica) ── */}
                {esParticulares && (
                    <Seccion titulo="Datos del Grupo" icono="group" colSpan2>
                        {/* Badge tipo grupo */}
                        {tipoGrupoBadge && (
                            <div className="sm:col-span-2">
                                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Tipo de Grupo</p>
                                <span className={cn(
                                    "inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-bold",
                                    tipoGrupoBadge.color
                                )}>
                                    <span className="material-symbols-outlined text-[16px]">{tipoGrupoBadge.icono}</span>
                                    {visita.tipo_grupo}
                                </span>
                            </div>
                        )}
                        <Dato label="Nombre del grupo" value={visita.grupo_nombre} icon="badge" />
                        <Dato label="Teléfono de contacto" value={visita.grupo_telefono} icon="call" />
                        <Dato label="Email de contacto" value={visita.grupo_email} icon="mail" />
                        <Dato label="Localidad" value={visita.grupo_localidad} icon="location_on" />
                        <Dato label="Provincia" value={visita.grupo_provincia} icon="map" />
                        <Dato label="País" value={visita.grupo_pais || 'Argentina'} icon="public" />
                    </Seccion>
                )}

                {/* ── 5. Accesibilidad (solo si aplica) ── */}
                {visita.tiene_discapacidad === true && (
                    <div className="md:col-span-2 bg-secondary/5 p-6 rounded-2xl border border-secondary/20 flex gap-5 items-start">
                        <div className="w-12 h-12 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-3xl">accessible_forward</span>
                        </div>
                        <div>
                            <h4 className="font-bold text-secondary text-xs uppercase tracking-widest mb-1">Requerimiento de Accesibilidad</h4>
                            <p className="text-on-surface text-lg font-medium leading-relaxed">
                                {visita.discapacidad_detalle || 'Se indicó requerimiento de accesibilidad sin especificar detalle.'}
                            </p>
                        </div>
                    </div>
                )}

                {/* ── 6. Observaciones (solo si hay) ── */}
                {visita.observaciones && (
                    <div className="md:col-span-2 bg-surface-container-low p-5 rounded-2xl border border-outline-variant">
                        <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">notes</span>
                            Observaciones
                        </p>
                        <p className="text-sm text-on-surface italic leading-relaxed">{visita.observaciones}</p>
                    </div>
                )}

                {/* ── Botones de acción ── */}
                <div className="md:col-span-2 flex justify-end gap-4 pt-2">
                    <Button
                        variant="outline"
                        onClick={handleReimprimir}
                        disabled={imprimiendo}
                    >
                        <span className={`material-symbols-outlined mr-1 ${imprimiendo ? 'animate-spin' : ''}`}>
                            {imprimiendo ? 'progress_activity' : 'print'}
                        </span>
                        {imprimiendo ? 'Generando...' : 'Reimprimir Comprobante'}
                    </Button>
                    <Button variant="outline" onClick={() => navigate(`/visitas/editar/${visita.id}`)}>
                        <span className="material-symbols-outlined">edit</span> Editar Visita
                    </Button>
                    {visita.estado !== 'Cancelada' && (
                        <Button
                            variant="outline"
                            className="border-error/30 text-error hover:bg-error/10"
                            onClick={handleCancelar}
                            disabled={cancelando}
                        >
                            <span className="material-symbols-outlined">cancel</span>
                            {cancelando ? 'Cancelando...' : 'Cancelar Turno'}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};