import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { cn } from '../utils/cn';
import { BADGE_ESTADO } from '../utils/visitaTypes';

export const DetalleVisita = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [visita, setVisita] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [cancelando, setCancelando] = useState(false);

    useEffect(() => {
        const fetchDetalle = async () => {
            const token = localStorage.getItem('token');
            try {
                const response = await fetch(`http://localhost:3000/api/visitas/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!response.ok) throw new Error('No se pudo cargar el detalle de la visita');

                const data = await response.json();
                setVisita(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchDetalle();
    }, [id]);

    const handleCancelar = async () => {
        const motivo = window.prompt('¿Está seguro de cancelar esta visita? Ingrese un motivo (opcional):');
        if (motivo === null) return; // El usuario presionó Cancelar en el prompt

        const token = localStorage.getItem('token');
        setCancelando(true);
        try {
            const response = await fetch(`http://localhost:3000/api/visitas/${id}/cancelar`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ motivo })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Error al cancelar la visita');
            }

            // Actualizamos el estado local para reflejar el cambio sin recargar
            setVisita((prev: any) => ({ ...prev, estado: 'Cancelada' }));
        } catch (err: any) {
            alert(`No se pudo cancelar: ${err.message}`);
        } finally {
            setCancelando(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-on-surface-variant animate-pulse">Cargando detalles...</div>;
    if (error || !visita) return <div className="p-8 text-center text-error">{error || 'Visita no encontrada'}</div>;

    // --- FUNCIÓN ROBUSTA PARA EVITAR EL NaN ---
    const formatFechaHora = () => {
        try {
            // Extraemos solo YYYY-MM-DD por si viene con T00:00:00
            const fechaLimpia = visita.fecha.includes('T') ? visita.fecha.split('T')[0] : visita.fecha;
            const [year, month, day] = fechaLimpia.split('-');
            const hora = visita.hora_inicio.slice(0, 5);
            return `${parseInt(day)}/${parseInt(month)}/${year} a las ${hora} hs`;
        } catch (e) {
            return "Fecha no disponible";
        }
    };

    return (
        <div className="flex flex-col max-w-[1000px] w-full mx-auto pb-12">
            {/* Header / Navegación */}
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-surface-container rounded-full transition-colors">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <div>
                    <h1 className="font-h1 text-h1 text-on-surface">Detalle de la Reserva</h1>
                    <p className="font-body-md text-on-surface-variant">Gestión y control de la visita programada.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* 1. Información Principal */}
                <div className="bg-surface-container-lowest p-8 rounded-3xl shadow-sm border border-outline-variant md:col-span-2">
                    <div className="flex justify-between items-start flex-wrap gap-4">
                        <div className="flex gap-6 items-center">
                            <div className="w-16 h-16 rounded-2xl bg-sky-100 text-sky-800 flex items-center justify-center font-bold text-xl border border-sky-200">
                                {visita.hora_inicio.slice(0, 5)}
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h2 className="text-3xl font-black text-on-surface">{visita.grupo_nombre}</h2>
                                    <span className={cn(
                                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                                        BADGE_ESTADO[visita.estado] ?? 'bg-surface-container text-outline border border-outline-variant'
                                    )}>
                                        {visita.estado}
                                    </span>
                                </div>
                                <p className="text-lg text-on-surface-variant font-medium flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[20px]">domain</span>
                                    {visita.gestor_nombre}
                                </p>
                            </div>
                        </div>

                        <div className="bg-surface-container-low px-6 py-3 rounded-2xl border border-outline-variant text-center">
                            <p className="text-2xl font-black text-primary leading-none">{visita.cantidad_personas}</p>
                            <p className="text-[10px] font-bold uppercase text-outline mt-1 tracking-tighter">Personas</p>
                        </div>
                    </div>
                </div>

                {/* 2. Agenda */}
                <div className="bg-surface-container-lowest p-8 rounded-3xl shadow-sm border border-outline-variant">
                    <div className="flex items-center gap-2 mb-6 text-primary">
                        <span className="material-symbols-outlined">calendar_month</span>
                        <h2 className="font-h3 text-h3">Agenda y Turno</h2>
                    </div>
                    <div className="space-y-6">
                        <div>
                            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Fecha y Hora</p>
                            <p className="font-body-lg text-on-surface font-semibold">{formatFechaHora()}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Tipo de Visita</p>
                            <p className="font-body-lg text-on-surface">{visita.tipo}</p>
                        </div>
                        <div className="flex items-center gap-2 py-2 px-4 bg-surface-container-low rounded-xl border border-outline-variant w-fit">
                            <span className={cn("material-symbols-outlined text-[20px]", visita.tiene_cruce_tunel ? "text-[#137333]" : "text-outline")}>
                                {visita.tiene_cruce_tunel ? 'check_circle' : 'cancel'}
                            </span>
                            <span className="text-sm font-bold text-on-surface">
                                {visita.tiene_cruce_tunel ? 'Realiza Cruce del Túnel' : 'Sin Cruce del Túnel'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 3. Información del Grupo */}
                <div className="bg-surface-container-lowest p-8 rounded-3xl shadow-sm border border-outline-variant">
                    <div className="flex items-center gap-2 mb-6 text-primary">
                        <span className="material-symbols-outlined">groups</span>
                        <h2 className="font-h3 text-h3">Información del Grupo</h2>
                    </div>
                    <div className="space-y-6">
                        <div>
                            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Nivel Educativo</p>
                            <p className="font-body-lg text-on-surface">{visita.nivel_educativo || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Observaciones</p>
                            <p className="font-body-lg text-on-surface italic text-on-surface-variant">
                                {visita.grupo_descripcion || 'Sin observaciones adicionales.'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 4. SECCIÓN ACCESIBILIDAD (Corregida la validación) */}
                {visita.tiene_discapacidad === true && (
                    <div className="md:col-span-2 bg-secondary-container/10 p-8 rounded-3xl border border-secondary/20 flex gap-6 items-start">
                        <div className="w-14 h-14 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-4xl">accessible_forward</span>
                        </div>
                        <div>
                            <h4 className="font-bold text-secondary text-sm uppercase tracking-widest mb-1">Requerimiento de Accesibilidad</h4>
                            <p className="text-on-surface text-xl font-medium leading-relaxed">
                                {visita.discapacidad_detalle || 'Se indicó requerimiento de accesibilidad.'}
                            </p>
                        </div>
                    </div>
                )}

                {/* Botones */}
                <div className="md:col-span-2 flex justify-end gap-4 mt-4">
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