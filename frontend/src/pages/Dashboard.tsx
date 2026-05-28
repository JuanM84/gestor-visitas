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
    const [diaInhabil, setDiaInhabil] = useState<{ esInhabil: boolean; descripcion: string }>({ esInhabil: false, descripcion: '' });

    // 2. Cada vez que la fecha cambie, actualizamos la URL y traemos los datos
    useEffect(() => {
        setSearchParams({ fecha: fechaSeleccionada }, { replace: true });

        const fetchDatos = async () => {
            setLoading(true);
            try {
                const headers = { 'Authorization': `Bearer ${token}` };

                // Traemos visitas y días inhábiles en paralelo
                const [resVisitas, resDias] = await Promise.all([
                    fetch(`${import.meta.env.VITE_API_URL}/api/visitas?fecha=${fechaSeleccionada}`, { headers }),
                    fetch(`${import.meta.env.VITE_API_URL}/api/dias-inhabiles`, { headers }),
                ]);

                if (resVisitas.ok) {
                    const result = await resVisitas.json();
                    setVisitas(result.data || []);
                }

                if (resDias.ok) {
                    const dias: any[] = await resDias.json();
                    const encontrado = dias.find(d => String(d.fecha).substring(0, 10) === fechaSeleccionada);
                    setDiaInhabil(encontrado
                        ? { esInhabil: true, descripcion: encontrado.descripcion }
                        : { esInhabil: false, descripcion: '' }
                    );
                }
            } catch (error) {
                console.error("Error al cargar datos:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDatos();
    }, [fechaSeleccionada, token, setSearchParams]);

    const cambiarFecha = (dias: number) => {
        const nuevaFecha = new Date(fechaSeleccionada + 'T12:00:00');
        nuevaFecha.setDate(nuevaFecha.getDate() + dias);
        setFechaSeleccionada(nuevaFecha.toISOString().split('T')[0]);
    };

    // Marca una visita como Realizada
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
            // silencioso
        } finally {
            setMarcandoRealizada(null);
        }
    };

    const visitasActivas = visitas.filter(v => v.estado !== 'Cancelada');
    const totalPersonas = visitasActivas.reduce((acc, v) => acc + parseInt(v.cantidad_personas), 0);
    const totalCruces = visitasActivas.filter(v => v.tiene_cruce_tunel).length;

    // Genera e imprime el PDF del día
    const [imprimiendoDia, setImprimiendoDia] = useState(false);

    const imprimirDia = async () => {
        setImprimiendoDia(true);
        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/estadisticas/exportar/diario?fecha=${fechaSeleccionada}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            if (!res.ok) throw new Error('Error al generar el PDF');
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Cronograma_${fechaSeleccionada}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Error al imprimir cronograma:', err);
        } finally {
            setImprimiendoDia(false);
        }
    };

    const SLOTS: string[] = [];
    for (let h = 8; h <= 17; h++) {
        const hh = h < 10 ? `0${h}` : `${h}`;
        SLOTS.push(`${hh}:00`);
        SLOTS.push(`${hh}:30`);
    }

    return (
        <div className="flex flex-col max-w-[1200px] w-full mx-auto pb-10">
            {/* CABECERA Y SELECTOR DE FECHA */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="font-h1 text-h1 text-on-surface">Dashboard Operativo</h1>
                    <p className="font-body-md text-on-surface-variant">Gestión de turnos y grupos.</p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Botón impresora: siempre visible */}
                    <button
                        onClick={imprimirDia}
                        disabled={imprimiendoDia}
                        title="Imprimir cronograma del día"
                        className="flex items-center justify-center w-10 h-10 rounded-lg border border-outline-variant bg-white hover:bg-surface-container hover:border-primary/40 text-on-surface-variant hover:text-primary transition-all shadow-sm disabled:opacity-50"
                    >
                        <span className={`material-symbols-outlined text-[20px] ${imprimiendoDia ? 'animate-spin' : ''}`}>
                            {imprimiendoDia ? 'progress_activity' : 'print'}
                        </span>
                    </button>

                    {!diaInhabil.esInhabil && (
                        <button
                            onClick={() => navigate(`/nueva-visita?fecha=${fechaSeleccionada}`)}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary-container transition-all shadow-sm text-sm"
                        >
                            <span className="material-symbols-outlined text-[18px]">add_circle</span>
                            Agendar para este día
                        </button>
                    )}

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

            {/* BANNER DÍA INHÁBIL */}
            {diaInhabil.esInhabil && (
                <div className="mb-6 flex items-center gap-4 p-4 bg-error-container/30 border border-error/30 rounded-2xl">
                    <div className="w-10 h-10 rounded-xl bg-error/10 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-error">event_busy</span>
                    </div>
                    <div>
                        <p className="font-bold text-error text-sm">Día Inhábil — No se pueden agendar visitas</p>
                        <p className="text-xs text-error/80 mt-0.5">{diaInhabil.descripcion}</p>
                    </div>
                </div>
            )}

            {/* TARJETAS DE RESUMEN (KPIs) */}
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

            {/* CRONOGRAMA */}
            <div className={cn(
                "bg-white rounded-2xl border shadow-sm overflow-hidden",
                diaInhabil.esInhabil ? "border-error/30" : "border-outline-variant"
            )}>
                <div className={cn(
                    "p-6 border-b flex justify-between items-center",
                    diaInhabil.esInhabil
                        ? "bg-error-container/10 border-error/20"
                        : "bg-surface-container-lowest border-surface-container-highest"
                )}>
                    <h3 className="font-h3 text-on-surface">Cronograma de Visitas</h3>
                    {diaInhabil.esInhabil ? (
                        <span className="flex items-center gap-1.5 text-sm font-bold text-error">
                            <span className="material-symbols-outlined text-[18px]">lock</span>
                            Día bloqueado
                        </span>
                    ) : (
                        <span className="text-sm font-medium text-outline">
                            {visitasActivas.length === 0
                                ? 'Todos los turnos disponibles'
                                : `${visitasActivas.length} turno${visitasActivas.length !== 1 ? 's' : ''} ocupado${visitasActivas.length !== 1 ? 's' : ''} · ${SLOTS.length - visitasActivas.length} libre${SLOTS.length - visitasActivas.length !== 1 ? 's' : ''}`
                            }
                        </span>
                    )}
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
                                                {/* Solo mostrar acciones si el día es hábil */}
                                                {!diaInhabil.esInhabil && visita.estado === 'Agendada' && (
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
                                if (diaInhabil.esInhabil) {
                                    // Día inhábil: slot no clickeable
                                    return (
                                        <div
                                            key={slot}
                                            className="flex items-center justify-between px-4 py-3 rounded-xl border border-dashed border-error/20 bg-error-container/5 opacity-60"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-xl bg-error-container/20 text-error/50 flex flex-col items-center justify-center border border-error/15 shrink-0">
                                                    <span className="text-base font-bold leading-none">{slot}</span>
                                                    <span className="text-[9px] uppercase font-semibold mt-0.5">HS</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-error/50">
                                                    <span className="material-symbols-outlined text-[18px]">block</span>
                                                    <span className="text-sm font-medium">No disponible</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }

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