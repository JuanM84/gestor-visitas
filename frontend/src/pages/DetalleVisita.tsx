import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { cn } from '../utils/cn';

export const DetalleVisita = () => {
    const { id } = useParams(); // Obtenemos el ID de la URL
    const navigate = useNavigate();
    const [visita, setVisita] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

    if (loading) return <div className="p-8 text-center text-on-surface-variant animate-pulse">Cargando detalles...</div>;
    if (error) return <div className="p-8 text-center text-error">{error}</div>;
    if (!visita) return <div className="p-8 text-center text-on-surface-variant">Visita no encontrada.</div>;

    return (
        <div className="flex flex-col max-w-[1000px] w-full mx-auto">
            {/* Cabecera */}
            <div className="flex items-center justify-between mb-lg">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/visitas')} className="p-2 rounded-full hover:bg-surface-container-low transition-colors text-on-surface-variant">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div>
                        <h1 className="font-h2 text-h2 text-on-surface flex items-center gap-3">
                            Detalle de Reserva
                            <span className={cn(
                                "text-sm px-3 py-1 rounded-full font-medium tracking-wide",
                                visita.estado === 'Confirmada' || visita.estado === 'Agendada' ? "bg-primary-container text-on-primary-container" :
                                    visita.estado === 'Realizada' ? "bg-[#e6f4ea] text-[#137333]" :
                                        visita.estado === 'Cancelada' ? "bg-error-container text-on-error-container" :
                                            "bg-surface-variant text-on-surface-variant"
                            )}>
                                {visita.estado}
                            </span>
                        </h1>
                        <p className="font-body-md text-on-surface-variant">Registrada por {visita.usuario_registro} el {new Date(visita.created_at).toLocaleDateString()}</p>
                    </div>
                </div>
                <Button variant="outline" onClick={() => window.print()}>
                    <span className="material-symbols-outlined text-[18px]">print</span>
                    Imprimir Comprobante
                </Button>
            </div>

            {/* Tarjetas de Información */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">

                {/* Tarjeta: Información de la Visita */}
                <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant">
                    <div className="flex items-center gap-2 mb-4 text-primary">
                        <span className="material-symbols-outlined">event_available</span>
                        <h2 className="font-h3 text-h3">Agenda</h2>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Fecha y Hora</p>
                            <p className="font-body-lg text-on-surface">{visita.fecha.split('T')[0]} a las {visita.hora_inicio} hs</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Tipo de Recorrido</p>
                            <p className="font-body-lg text-on-surface">{visita.visita_tipo} {visita.tiene_cruce_tunel ? '(Incluye cruce de túnel)' : ''}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Cantidad de Personas</p>
                            <p className="font-body-lg text-on-surface">{visita.cantidad_personas} visitantes</p>
                        </div>
                    </div>
                </div>

                {/* Tarjeta: Institución / Gestor */}
                <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant">
                    <div className="flex items-center gap-2 mb-4 text-primary">
                        <span className="material-symbols-outlined">domain</span>
                        <h2 className="font-h3 text-h3">Institución a Cargo</h2>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Nombre</p>
                            <p className="font-body-lg text-on-surface">{visita.gestor_nombre}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Tipo</p>
                                <p className="font-body-lg text-on-surface">{visita.gestor_tipo}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Teléfono</p>
                                <p className="font-body-lg text-on-surface">{visita.telefono || 'No registrado'}</p>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Correo Electrónico</p>
                            <p className="font-body-lg text-on-surface">{visita.email || 'No registrado'}</p>
                        </div>
                    </div>
                </div>

                {/* Tarjeta: Detalles del Grupo */}
                <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant md:col-span-2">
                    <div className="flex items-center gap-2 mb-4 text-primary">
                        <span className="material-symbols-outlined">groups</span>
                        <h2 className="font-h3 text-h3">Detalles del Grupo</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Nombre del Grupo</p>
                            <p className="font-body-lg text-on-surface">{visita.grupo_nombre}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Tipo y Nivel</p>
                            <p className="font-body-lg text-on-surface">{visita.grupo_tipo} {visita.nivel_educativo ? `- ${visita.nivel_educativo}` : ''}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Observaciones</p>
                            <p className="font-body-lg text-on-surface">{visita.grupo_descripcion || 'Sin observaciones adicionales.'}</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};