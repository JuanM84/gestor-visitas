import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { cn } from '../utils/cn';
import { useAuth } from '../context/AuthContext';

export const Dashboard = () => {
    const navigate = useNavigate();
    const { token } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();

    const fechaInicial = searchParams.get('fecha') || new Date().toISOString().split('T')[0];
    const [fechaSeleccionada, setFechaSeleccionada] = useState(fechaInicial);

    const [visitas, setVisitas] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // 2. Cada vez que la fecha cambie, actualizamos la URL y traemos los datos
    useEffect(() => {
        // Actualizamos la URL sin recargar la página (usamos replace para no llenar el historial del navegador)
        setSearchParams({ fecha: fechaSeleccionada }, { replace: true });

        const fetchVisitas = async () => {
            setLoading(true);
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/visitas?fecha=${fechaSeleccionada}`, {
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

    // Marca una visita como Realizada (actualiza estado local sin recargar)
    const [marcandoRealizada, setMarcandoRealizada] = useState<string | null>(null);

    const marcarRealizada = async (visitaId: string) => {
        setMarcandoRealizada(visitaId);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/visitas/${visitaId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ estado: 'Realizada' })
            });
            if (res.ok) {
                setVisitas(prev => prev.map(v => v.id === visitaId ? { ...v, estado: 'Realizada' } : v));
            }
        } catch {
            // silencioso — el slot no cambia si hay error
        } finally {
            setMarcandoRealizada(null);
        }
    };
    // Solo visitas activas (sin canceladas) — usadas en KPIs y cronograma
    const visitasActivas = visitas.filter(v => v.estado !== 'Cancelada');
    const totalPersonas = visitasActivas.reduce((acc, v) => acc + parseInt(v.cantidad_personas), 0);
    const totalCruces = visitasActivas.filter(v => v.tiene_cruce_tunel).length;

    // Todos los slots del día: 08:00 a 17:30, cada 30 minutos (20 slots)
    const SLOTS: string[] = [];
    for (let h = 8; h <= 17; h++) {
        const hh = h < 10 ? `0${h}` : `${h}`;
        SLOTS.push(`${hh}:00`);
        SLOTS.push(`${hh}:30`);
    }
    // Recortamos el último que sería 17:30 — ya está incluido, quitamos el que supera (18:00 no se genera porque h<=17)
    // El bucle genera: 08:00, 08:30, ..., 17:00, 17:30 ✓

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

            {/* TARJETAS DE RESUMEN (KPIs) — solo visitas activas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl border border-outline-variant shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                        <span className="material-symbols-outlined text-3xl">confirmation_number</span>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-on-surface-variant uppercase tracking-wider">Total Visitas</p>
                        <h2 className="text-3xl font-black text-on-surface">{visitasActivas.length}</h2>
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

            {/* CRONOGRAMA — todos los slots 08:00 a 17:30 */}
            <div className="bg-white rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
                <div className="p-6 border-b border-surface-container-highest flex justify-between items-center bg-surface-container-lowest">
                    <h3 className="font-h3 text-on-surface">Cronograma de Visitas</h3>
                    <span className="text-sm font-medium text-outline">
                        {visitasActivas.length === 0
                            ? 'Todos los turnos disponibles'
                            : `${visitasActivas.length} turno${visitasActivas.length !== 1 ? 's' : ''} ocupado${visitasActivas.length !== 1 ? 's' : ''} · ${SLOTS.length - visitasActivas.length} libre${SLOTS.length - visitasActivas.length !== 1 ? 's' : ''}`
                        }
                    </span>
                </div>

                <div className="p-4">
                    {loading ? (
                        <div className="py-20 text-center text-outline animate-pulse">Cargando cronograma...</div>
                    ) : (
                        <div className="space-y-2">
                            {SLOTS.map((slot) => {
                                const visita = visitasActivas.find(v => v.hora_inicio.slice(0, 5) === slot);

                                if (visita) {
                                    // ── Slot OCUPADO ──
                                    return (
                                        <div
                                            key={slot}
                                            className="group p-4 border border-outline-variant rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-primary/40 hover:bg-primary/[0.02] transition-all"
                                        >
                                            <div className="flex gap-4 items-center">
                                                <div className="w-14 h-14 rounded-2xl bg-sky-100 text-sky-800 flex flex-col items-center justify-center border border-sky-200 shrink-0">
                                                    <span className="text-base font-black leading-none">{slot}</span>
                                                    <span className="text-[9px] uppercase font-bold mt-0.5">HS</span>
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <h4 className="font-black text-on-surface text-lg leading-tight">{visita.grupo_nombre}</h4>
                                                        {visita.tiene_cruce_tunel && (
                                                            <span className="material-symbols-outlined text-amber-600 text-[18px]" title="Realiza cruce del túnel">swap_horiz</span>
                                                        )}
                                                        {visita.tiene_discapacidad && (
                                                            <span className="material-symbols-outlined text-secondary text-[18px]" title="Requiere accesibilidad">accessible_forward</span>
                                                        )}
                                                    </div>
                                                    <p className="text-on-surface-variant flex items-center gap-1 text-sm font-medium">
                                                        <span className="material-symbols-outlined text-[16px]">manage_accounts</span>
                                                        {visita.gestor_nombre}
                                                        <span className="mx-1 text-outline">•</span>
                                                        <span>{visita.tipo}</span>
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 self-end md:self-center">
                                                <div className="text-right">
                                                    <p className="text-xl font-black text-primary leading-none">{visita.cantidad_personas}</p>
                                                    <p className="text-[10px] uppercase font-bold text-outline mt-0.5">Personas</p>
                                                </div>
                                                {visita.estado === 'Agendada' && (
                                                    <button
                                                        onClick={() => marcarRealizada(visita.id)}
                                                        disabled={marcandoRealizada === visita.id}
                                                        title="Marcar como realizada"
                                                        className="p-2 hover:bg-green-50 rounded-full text-[#137333] transition-colors disabled:opacity-40"
                                                    >
                                                        <span className="material-symbols-outlined">
                                                            {marcandoRealizada === visita.id ? 'progress_activity' : 'check_circle'}
                                                        </span>
                                                    </button>
                                                )}
                                                {visita.estado === 'Realizada' && (
                                                    <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[#137333] bg-green-50 border border-[#137333]/20 text-xs font-bold">
                                                        <span className="material-symbols-outlined text-[15px]">check_circle</span>
                                                        Realizada
                                                    </span>
                                                )}
                                                <button
                                                    onClick={() => navigate(`/visitas/${visita.id}`)}
                                                    className="p-2 hover:bg-surface-container rounded-full text-on-surface-variant transition-colors"
                                                    title="Ver detalle"
                                                >
                                                    <span className="material-symbols-outlined">visibility</span>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                }

                                // ── Slot LIBRE ──
                                return (
                                    <div
                                        key={slot}
                                        className="group flex items-center justify-between px-4 py-3 rounded-xl border border-dashed border-outline-variant/60 hover:border-primary/40 hover:bg-primary/[0.015] transition-all"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-xl bg-surface-container text-outline flex flex-col items-center justify-center border border-outline-variant/50 shrink-0">
                                                <span className="text-base font-bold leading-none">{slot}</span>
                                                <span className="text-[9px] uppercase font-semibold mt-0.5">HS</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-outline">
                                                <span className="material-symbols-outlined text-[18px]">event_available</span>
                                                <span className="text-sm font-medium">Turno disponible</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => navigate(`/nueva-visita?fecha=${fechaSeleccionada}&hora=${slot}`)}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 px-3 py-1.5 rounded-lg text-primary border border-primary/30 bg-primary/5 hover:bg-primary/10 text-xs font-bold"
                                        >
                                            <span className="material-symbols-outlined text-[14px]">add</span>
                                            Agendar
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};