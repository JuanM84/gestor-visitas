import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

// ─── Sub-componente reutilizable: bloque de estadísticas ───────────────────────
const StatsBlocks = ({ stats, etiquetaPeriodo }: { stats: any; etiquetaPeriodo: string }) => {
    const maxPersonas = Math.max(...stats.evolucion.map((e: any) => parseInt(e.personas)), 1);
    const paleta = ['bg-blue-500', 'bg-violet-500', 'bg-cyan-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500'];

    return (
        <div className="flex flex-col gap-8">
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-outline-variant shadow-sm">
                    <p className="text-xs font-bold uppercase text-on-surface-variant mb-2">Visitas Totales</p>
                    <h2 className="text-4xl font-black text-on-surface">{stats.kpis.visitas}</h2>
                </div>
                <div className="bg-primary text-white p-6 rounded-3xl shadow-md">
                    <p className="text-xs font-bold uppercase text-primary-container mb-2">Personas Recibidas</p>
                    <h2 className="text-4xl font-black">{stats.kpis.personas}</h2>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-outline-variant shadow-sm">
                    <p className="text-xs font-bold uppercase text-on-surface-variant mb-2">Cruces de Túnel</p>
                    <h2 className="text-4xl font-black text-[#137333]">{stats.kpis.cruces}</h2>
                </div>
                <div className="bg-error-container/30 p-6 rounded-3xl border border-error/20 shadow-sm">
                    <p className="text-xs font-bold uppercase text-error mb-2">Cancelaciones</p>
                    <h2 className="text-4xl font-black text-error">{stats.kpis.canceladas}</h2>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Gráfico Evolución */}
                <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-outline-variant shadow-sm">
                    <h3 className="font-h3 mb-1">Evolución de Ocupación</h3>
                    <p className="text-xs text-outline mb-6">{etiquetaPeriodo}</p>
                    {stats.evolucion.length === 0 ? (
                        <div className="text-center text-outline py-10">No hay datos registrados en este período.</div>
                    ) : (
                        <div className="h-48 flex items-end gap-2 overflow-x-auto pb-2">
                            {stats.evolucion.map((dia: any, index: number) => {
                                const heightPercent = (parseInt(dia.personas) / maxPersonas) * 100;
                                return (
                                    <div key={index} className="flex flex-col items-center flex-1 min-w-[30px] group">
                                        <div
                                            className="w-full bg-primary/20 hover:bg-primary rounded-t-sm transition-all relative"
                                            style={{ height: `${heightPercent}%`, minHeight: '4px' }}
                                        >
                                            <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-surface-container-highest text-on-surface text-xs font-bold py-1 px-2 rounded pointer-events-none transition-opacity">
                                                {dia.personas}
                                            </div>
                                        </div>
                                        <span className="text-[10px] text-outline mt-2 font-bold">{dia.dia}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Ranking Gestores */}
                <div className="bg-white p-8 rounded-3xl border border-outline-variant shadow-sm">
                    <h3 className="font-h3 mb-6">Top Instituciones</h3>
                    {stats.rankingGestores.length === 0 ? (
                        <div className="text-center text-outline py-10">Sin registros.</div>
                    ) : (
                        <div className="space-y-6">
                            {stats.rankingGestores.map((gestor: any, index: number) => (
                                <div key={index} className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center font-bold text-on-surface-variant text-sm shrink-0">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-on-surface truncate" title={gestor.nombre}>{gestor.nombre}</p>
                                        <p className="text-xs text-on-surface-variant">{gestor.cantidad_visitas} visitas</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="font-black text-primary">{gestor.total_personas}</p>
                                        <p className="text-[10px] uppercase text-outline">Personas</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Distribución de Grupos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Tipo de visitante */}
                <div className="bg-white p-8 rounded-3xl border border-outline-variant shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                        <span className="material-symbols-outlined text-primary">pie_chart</span>
                        <h3 className="font-h3">Tipo de Visitante</h3>
                    </div>
                    {!stats.distribucionTipo || stats.distribucionTipo.length === 0 ? (
                        <div className="text-center text-outline py-10">Sin registros para este período.</div>
                    ) : (() => {
                        const total = stats.distribucionTipo.reduce((acc: number, t: any) => acc + parseInt(t.total_personas), 0);
                        const colores: Record<string, string> = { 'Institución': 'bg-primary', 'Particulares': 'bg-secondary' };
                        const coloresTexto: Record<string, string> = { 'Institución': 'text-primary', 'Particulares': 'text-secondary' };
                        return (
                            <div className="space-y-5">
                                {stats.distribucionTipo.map((tipo: any, i: number) => {
                                    const pct = total > 0 ? Math.round((parseInt(tipo.total_personas) / total) * 100) : 0;
                                    const color = colores[tipo.tipo_visitante] || 'bg-outline';
                                    const colorTxt = coloresTexto[tipo.tipo_visitante] || 'text-outline';
                                    return (
                                        <div key={i}>
                                            <div className="flex justify-between items-center mb-1.5">
                                                <div className="flex items-center gap-2">
                                                    <span className={`material-symbols-outlined text-[18px] ${colorTxt}`}>
                                                        {tipo.tipo_visitante === 'Institución' ? 'school' : 'group'}
                                                    </span>
                                                    <span className="font-semibold text-on-surface text-sm">{tipo.tipo_visitante}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className={`font-black text-sm ${colorTxt}`}>{pct}%</span>
                                                    <span className="text-xs text-outline ml-2">({tipo.total_personas} personas · {tipo.cantidad_visitas} visitas)</span>
                                                </div>
                                            </div>
                                            <div className="h-3 bg-surface-container rounded-full overflow-hidden">
                                                <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                                            </div>
                                        </div>
                                    );
                                })}
                                <p className="text-xs text-outline text-right pt-2 border-t border-outline-variant">
                                    Total: <span className="font-bold text-on-surface">{total} personas</span>
                                </p>
                            </div>
                        );
                    })()}
                </div>

                {/* Nivel educativo */}
                <div className="bg-white p-8 rounded-3xl border border-outline-variant shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                        <span className="material-symbols-outlined text-primary">school</span>
                        <h3 className="font-h3">Nivel Educativo</h3>
                        <span className="text-xs text-outline ml-1">(solo instituciones)</span>
                    </div>
                    {!stats.desglosePorNivel || stats.desglosePorNivel.length === 0 ? (
                        <div className="text-center text-outline py-10">Sin visitas institucionales en este período.</div>
                    ) : (() => {
                        const maxNivel = Math.max(...stats.desglosePorNivel.map((n: any) => parseInt(n.total_personas)));
                        return (
                            <div className="space-y-4">
                                {stats.desglosePorNivel.map((nivel: any, i: number) => {
                                    const pct = maxNivel > 0 ? Math.round((parseInt(nivel.total_personas) / maxNivel) * 100) : 0;
                                    return (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className="w-24 text-xs font-semibold text-on-surface-variant text-right shrink-0 truncate" title={nivel.nivel_educativo}>
                                                {nivel.nivel_educativo}
                                            </div>
                                            <div className="flex-1 h-3 bg-surface-container rounded-full overflow-hidden">
                                                <div className={`h-full ${paleta[i % paleta.length]} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                                            </div>
                                            <div className="text-right shrink-0">
                                                <span className="font-black text-on-surface text-sm">{nivel.total_personas}</span>
                                                <span className="text-[10px] text-outline ml-1">pers.</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })()}
                </div>
            </div>
        </div>
    );
};

// ─── Componente principal ──────────────────────────────────────────────────────
export const DashboardAdmin = () => {
    const { token } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [mesActual, setMesActual] = useState(new Date().getMonth() + 1);
    const [anioActual, setAnioActual] = useState(new Date().getFullYear());

    // ── Modal rango de fechas ──
    const [modalRango, setModalRango] = useState(false);
    const [rangoDesde, setRangoDesde] = useState('');
    const [rangoHasta, setRangoHasta] = useState('');
    const [errorRango, setErrorRango] = useState<string | null>(null);
    const [statsRango, setStatsRango] = useState<any>(null);
    const [loadingRango, setLoadingRango] = useState(false);

    const nombresMeses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/estadisticas/admin?mes=${mesActual}&anio=${anioActual}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (error) {
                console.error("Error cargando estadísticas", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [mesActual, anioActual, token]);

    const handleMesAnterior = () => {
        if (mesActual === 1) { setMesActual(12); setAnioActual(anioActual - 1); }
        else { setMesActual(mesActual - 1); }
    };

    const handleMesSiguiente = () => {
        if (mesActual === 12) { setMesActual(1); setAnioActual(anioActual + 1); }
        else { setMesActual(mesActual + 1); }
    };

    const handleExportar = async () => {
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/estadisticas/exportar?mes=${mesActual}&anio=${anioActual}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            if (!response.ok) throw new Error('Error al generar el reporte');
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Reporte_${mesActual}_${anioActual}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Error exportando:', err);
        }
    };

    // ── Consulta por rango ──
    const handleConsultarRango = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorRango(null);

        if (!rangoDesde || !rangoHasta) {
            setErrorRango('Completá ambas fechas.');
            return;
        }
        if (rangoDesde > rangoHasta) {
            setErrorRango('La fecha "Desde" debe ser anterior o igual a la fecha "Hasta".');
            return;
        }

        setLoadingRango(true);
        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/estadisticas/rango?desde=${rangoDesde}&hasta=${rangoHasta}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Error al consultar');
            }
            setStatsRango(await res.json());
        } catch (err: any) {
            setErrorRango(err.message);
        } finally {
            setLoadingRango(false);
        }
    };

    const cerrarModalRango = () => {
        setModalRango(false);
        setStatsRango(null);
        setRangoDesde('');
        setRangoHasta('');
        setErrorRango(null);
    };

    const formatFechaLabel = (f: string) => {
        const [y, m, d] = f.split('-');
        return `${parseInt(d)}/${parseInt(m)}/${y}`;
    };

    const inp = "w-full h-10 px-3 rounded-lg border border-outline-variant bg-white outline-none focus:border-primary transition-all text-sm";

    if (loading || !stats) return <div className="p-10 text-center animate-pulse">Cargando métricas gerenciales...</div>;

    return (
        <div className="flex flex-col max-w-[1200px] w-full mx-auto pb-12">

            {/* ── Modal Rango de Fechas ── */}
            {modalRango && (
                <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-6 overflow-hidden">
                        {/* Header */}
                        <div className="bg-primary px-6 py-5 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-white text-[22px]">date_range</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-white leading-tight">Estadísticas por Rango de Fechas</h3>
                                <p className="text-white/70 text-xs">Consultá métricas para cualquier período personalizado</p>
                            </div>
                            <button onClick={cerrarModalRango} className="ml-auto p-1 rounded-full hover:bg-white/20 text-white transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        {/* Formulario de fechas */}
                        <form onSubmit={handleConsultarRango} className="p-6 border-b border-outline-variant">
                            <div className="flex flex-col sm:flex-row gap-4 items-end">
                                <div className="flex-1">
                                    <label className="text-xs font-bold uppercase text-outline block mb-1">Desde</label>
                                    <input
                                        type="date"
                                        required
                                        className={inp}
                                        value={rangoDesde}
                                        onChange={e => {
                                            setRangoDesde(e.target.value);
                                            setErrorRango(null);
                                        }}
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs font-bold uppercase text-outline block mb-1">Hasta</label>
                                    <input
                                        type="date"
                                        required
                                        className={inp}
                                        value={rangoHasta}
                                        min={rangoDesde}
                                        onChange={e => {
                                            setRangoHasta(e.target.value);
                                            setErrorRango(null);
                                        }}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loadingRango}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 transition-all shadow-sm text-sm disabled:opacity-60 whitespace-nowrap h-10"
                                >
                                    {loadingRango
                                        ? <><span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span> Consultando...</>
                                        : <><span className="material-symbols-outlined text-[18px]">search</span> Consultar</>
                                    }
                                </button>
                            </div>
                            {errorRango && (
                                <div className="mt-3 flex items-center gap-2 text-error text-sm font-medium">
                                    <span className="material-symbols-outlined text-[16px]">error</span>
                                    {errorRango}
                                </div>
                            )}
                        </form>

                        {/* Resultados */}
                        <div className="p-6">
                            {!statsRango && !loadingRango && (
                                <div className="py-16 text-center text-on-surface-variant">
                                    <span className="material-symbols-outlined text-5xl text-outline mb-3 block">insert_chart</span>
                                    <p className="font-medium">Seleccioná un rango y presioná "Consultar"</p>
                                    <p className="text-sm text-outline mt-1">Las estadísticas aparecerán aquí</p>
                                </div>
                            )}
                            {loadingRango && (
                                <div className="py-16 text-center text-outline animate-pulse">Cargando estadísticas...</div>
                            )}
                            {statsRango && !loadingRango && (
                                <div>
                                    <div className="flex items-center gap-2 mb-6 pb-4 border-b border-outline-variant">
                                        <span className="material-symbols-outlined text-primary">calendar_month</span>
                                        <p className="font-bold text-on-surface">
                                            Período: <span className="text-primary">{formatFechaLabel(rangoDesde)}</span>
                                            <span className="mx-2 text-outline">→</span>
                                            <span className="text-primary">{formatFechaLabel(rangoHasta)}</span>
                                        </p>
                                    </div>
                                    <StatsBlocks
                                        stats={statsRango}
                                        etiquetaPeriodo={`${formatFechaLabel(rangoDesde)} al ${formatFechaLabel(rangoHasta)}`}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="font-h1 text-h1 text-on-surface">Dashboard Gerencial</h1>
                    <p className="font-body-md text-on-surface-variant">Indicadores clave de rendimiento (KPIs) y analíticas.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleExportar}
                        className="flex items-center gap-2 px-4 py-2 border border-primary text-primary rounded-xl font-bold hover:bg-primary/5 transition-all shadow-sm"
                    >
                        <span className="material-symbols-outlined text-[18px]">download</span>
                        Exportar Mes
                    </button>

                    <button
                        onClick={() => setModalRango(true)}
                        className="flex items-center gap-2 px-4 py-2 border border-primary text-primary rounded-xl font-bold hover:bg-primary/5 transition-all shadow-sm"
                    >
                        <span className="material-symbols-outlined text-[18px]">date_range</span>
                        Consultar Rango
                    </button>

                    <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-2xl border border-outline-variant shadow-sm">
                        <button onClick={handleMesAnterior} className="p-2 hover:bg-surface-container rounded-lg"><span className="material-symbols-outlined">chevron_left</span></button>
                        <span className="font-bold text-primary min-w-[120px] text-center">{nombresMeses[mesActual - 1]} {anioActual}</span>
                        <button onClick={handleMesSiguiente} className="p-2 hover:bg-surface-container rounded-lg"><span className="material-symbols-outlined">chevron_right</span></button>
                    </div>
                </div>
            </div>

            {/* Estadísticas del mes actual */}
            <StatsBlocks
                stats={stats}
                etiquetaPeriodo={`${nombresMeses[mesActual - 1]} ${anioActual}`}
            />
        </div>
    );
};