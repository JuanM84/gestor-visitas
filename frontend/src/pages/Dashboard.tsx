import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { cn } from '../utils/cn';

export const Dashboard = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams(); // Obtenemos acceso a los parámetros de la URL

    // 1. Inicializamos la fecha leyendo la URL, o usamos la de hoy si no hay ninguna
    const fechaInicial = searchParams.get('fecha') || new Date().toISOString().split('T')[0];
    const [fechaSeleccionada, setFechaSeleccionada] = useState(fechaInicial);

    const [visitas, setVisitas] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem('token');

    // 2. Cada vez que la fecha cambie, actualizamos la URL y traemos los datos
    useEffect(() => {
        // Actualizamos la URL sin recargar la página (usamos replace para no llenar el historial del navegador)
        setSearchParams({ fecha: fechaSeleccionada }, { replace: true });

        const fetchVisitas = async () => {
            setLoading(true);
            try {
                const response = await fetch(`http://localhost:3000/api/visitas?fecha=${fechaSeleccionada}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const result = await response.json();
                    setVisitas(result.data || []);
                }
            } catch (error) {
                console.error("Error al cargar visitas:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchVisitas();
    }, [fechaSeleccionada, token, setSearchParams]);

    const cambiarFecha = (dias: number) => {
        const nuevaFecha = new Date(fechaSeleccionada + 'T12:00:00'); // T12 para evitar bugs de zona horaria
        nuevaFecha.setDate(nuevaFecha.getDate() + dias);
        setFechaSeleccionada(nuevaFecha.toISOString().split('T')[0]);
    };

    // Cálculos para las tarjetas de resumen
    const totalPersonas = visitas.reduce((acc, v) => acc + parseInt(v.cantidad_personas), 0);
    const totalCruces = visitas.filter(v => v.tiene_cruce_tunel).length;

    return (
        <div className="flex flex-col max-w-[1200px] w-full mx-auto pb-10">
            {/* CABECERA Y SELECTOR DE FECHA */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="font-h1 text-h1 text-on-surface">Dashboard Operativo</h1>
                    <p className="font-body-md text-on-surface-variant">Gestión de turnos y grupos.</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(`/nueva-visita?fecha=${fechaSeleccionada}`)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary-container transition-all shadow-sm text-sm"
                    >
                        <span className="material-symbols-outlined text-[18px]">add_circle</span>
                        Agendar para este día
                    </button>

                    <div className="flex items-center gap-2 bg-surface-container-low p-1.5 rounded-xl border border-outline-variant shadow-sm">
                        <button onClick={() => cambiarFecha(-1)} className="p-2 hover:bg-surface-container rounded-lg transition-colors">
                            <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                        </button>
                        <input
                            type="date"
                            value={fechaSeleccionada}
                            onChange={(e) => setFechaSeleccionada(e.target.value)}
                            className="bg-transparent border-none font-bold text-primary focus:ring-0 cursor-pointer"
                        />
                        <button onClick={() => cambiarFecha(1)} className="p-2 hover:bg-surface-container rounded-lg transition-colors">
                            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* TARJETAS DE RESUMEN (KPIs) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl border border-outline-variant shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                        <span className="material-symbols-outlined text-3xl">confirmation_number</span>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-on-surface-variant uppercase tracking-wider">Total Visitas</p>
                        <h2 className="text-3xl font-black text-on-surface">{visitas.length}</h2>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-outline-variant shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-secondary/10 text-secondary rounded-xl flex items-center justify-center">
                        <span className="material-symbols-outlined text-3xl">groups</span>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-on-surface-variant uppercase tracking-wider">Total Personas</p>
                        <h2 className="text-3xl font-black text-on-surface">{totalPersonas}</h2>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-outline-variant shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center">
                        <span className="material-symbols-outlined text-3xl">commute</span>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-on-surface-variant uppercase tracking-wider">Cruces Túnel</p>
                        <h2 className="text-3xl font-black text-on-surface">{totalCruces}</h2>
                    </div>
                </div>
            </div>

            {/* LISTADO DE TURNOS */}
            <div className="bg-white rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
                <div className="p-6 border-b border-surface-container-highest flex justify-between items-center bg-surface-container-lowest">
                    <h3 className="font-h3 text-on-surface">Cronograma de Visitas</h3>
                    <span className="text-sm font-medium text-outline">
                        {visitas.length === 0 ? 'Sin registros' : `${visitas.length} turnos programados`}
                    </span>
                </div>

                <div className="p-6">
                    {loading ? (
                        <div className="py-20 text-center text-outline">Cargando cronograma...</div>
                    ) : visitas.length === 0 ? (
                        <div className="py-20 text-center flex flex-col items-center gap-4">
                            <span className="material-symbols-outlined text-6xl text-surface-container-high">event_busy</span>
                            <p className="text-on-surface-variant font-medium">No hay visitas agendadas para esta fecha.</p>
                            <button
                                onClick={() => navigate(`/nueva-visita?fecha=${fechaSeleccionada}`)}
                                className="mt-2 text-primary font-bold hover:underline"
                            >
                                Registrar una visita ahora
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {visitas.map((visita) => (
                                <div
                                    key={visita.id}
                                    className="group p-5 border border-outline-variant rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-primary/40 hover:bg-primary/[0.02] transition-all"
                                >
                                    <div className="flex gap-5 items-center">
                                        <div className="w-16 h-16 rounded-2xl bg-sky-100 text-sky-800 flex flex-col items-center justify-center border border-sky-200 shrink-0">
                                            <span className="text-lg font-black leading-none">{visita.hora_inicio.slice(0, 5)}</span>
                                            <span className="text-[10px] uppercase font-bold mt-1">HS</span>
                                        </div>

                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-black text-on-surface text-xl">{visita.grupo_nombre}</h4>
                                                {visita.tiene_cruce_tunel && (
                                                    <span className="material-symbols-outlined text-amber-600 text-[20px]" title="Realiza cruce del túnel">swap_horiz</span>
                                                )}
                                                {visita.tiene_discapacidad && (
                                                    <span className="material-symbols-outlined text-secondary text-[20px]" title="Requiere accesibilidad">accessible_forward</span>
                                                )}
                                            </div>
                                            <p className="text-on-surface-variant flex items-center gap-1.5 font-medium">
                                                <span className="material-symbols-outlined text-[18px]">domain</span>
                                                {visita.gestor_nombre}
                                                <span className="mx-1 text-outline">•</span>
                                                <span className="text-sm">{visita.tipo}</span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6 self-end md:self-center">
                                        <div className="text-right">
                                            <p className="text-xl font-black text-primary leading-none">{visita.cantidad_personas}</p>
                                            <p className="text-[10px] uppercase font-bold text-outline mt-1">Personas</p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => navigate(`/visitas/${visita.id}`)}
                                                className="p-2 hover:bg-surface-container rounded-full text-on-surface-variant transition-colors"
                                                title="Ver detalle"
                                            >
                                                <span className="material-symbols-outlined">visibility</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};