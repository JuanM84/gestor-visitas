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

            {/* Gráfico Evolución — fila completa */}
            <div className="bg-white p-8 rounded-3xl border border-outline-variant shadow-sm flex flex-col justify-between">
                <div>
                    <h3 className="font-h3 mb-1">Evolución de Ocupación</h3>
                    <p className="text-xs text-outline mb-6">{etiquetaPeriodo}</p>
                </div>
                {stats.evolucion.length === 0 ? (
                    <div className="text-center text-outline py-10">No hay datos registrados en este período.</div>
                ) : (
                    <div>
                        <div className="h-48 flex items-end gap-2 overflow-x-auto pb-2">
                            {stats.evolucion.map((dia: any, index: number) => {
                                const personas = parseInt(dia.personas);
                                const heightPercent = maxPersonas > 0 ? (personas / maxPersonas) * 100 : 0;
                                const limiteReferencia = 1600;
                                const porcentajeAforo = (personas / limiteReferencia) * 100;
                                let colorBarra = 'bg-emerald-500/20 hover:bg-emerald-500/40 border border-emerald-500/30 hover:border-emerald-500';
                                if (personas >= 1200) {
                                    colorBarra = 'bg-rose-500/20 hover:bg-rose-500/40 border border-rose-500/30 hover:border-rose-500';
                                } else if (personas >= 500) {
                                    colorBarra = 'bg-amber-500/20 hover:bg-amber-500/40 border border-amber-500/30 hover:border-amber-500';
                                }
                                return (
                                    <div key={index} className="flex flex-col items-center flex-1 min-w-[30px] group h-full justify-end">
                                        <div
                                            className={`w-full ${colorBarra} rounded-t-md transition-all relative`}
                                            style={{ height: `${heightPercent}%`, minHeight: '12px' }}
                                        >
                                            <div className="opacity-0 group-hover:opacity-100 absolute -top-12 left-1/2 -translate-x-1/2 bg-surface-container-highest text-on-surface text-[10px] font-bold py-1.5 px-2.5 rounded-lg border border-outline-variant shadow-md pointer-events-none transition-opacity z-10 whitespace-nowrap">
                                                <span className="block text-[8px] text-outline font-normal">Ocupación</span>
                                                {personas} personas ({porcentajeAforo.toFixed(1)}% del aforo)
                                            </div>
                                        </div>
                                        <span className="text-[10px] text-outline mt-2 font-bold">{dia.dia}</span>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex flex-wrap gap-4 mt-4 pt-3 border-t border-outline-variant text-[11px] font-bold justify-between items-center text-on-surface-variant">
                            <span className="text-[10px] text-outline font-medium">Aforo Diario Máximo: 1600 personas</span>
                            <div className="flex flex-wrap gap-4">
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500"></span>
                                    Baja Ocupación (&lt; 500 pers.)
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/20 border border-amber-500"></span>
                                    Media Ocupación (500 - 1200 pers.)
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/20 border border-rose-500"></span>
                                    Alta Ocupación (&ge; 1200 pers. / Máx 1600)
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Top Gestores — fila completa con layout horizontal */}
            <div className="bg-white p-8 rounded-3xl border border-outline-variant shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                    <span className="material-symbols-outlined text-primary">emoji_events</span>
                    <h3 className="font-h3">Top Gestores</h3>
                </div>
                {stats.rankingGestores.length === 0 ? (
                    <div className="text-center text-outline py-6">Sin registros.</div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                        {stats.rankingGestores.map((gestor: any, index: number) => (
                            <div key={index} className="flex flex-col gap-2 p-4 rounded-2xl bg-surface-container/50 border border-outline-variant hover:border-primary/40 hover:bg-primary/5 transition-all">
                                <div className="flex items-center gap-2">
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${index === 0 ? 'bg-amber-400 text-white' : index === 1 ? 'bg-slate-400 text-white' : index === 2 ? 'bg-orange-400 text-white' : 'bg-surface-container-high text-on-surface-variant'}`}>
                                        {index + 1}
                                    </div>
                                    <p className="font-bold text-on-surface text-sm leading-tight" title={gestor.nombre}>{gestor.nombre}</p>
                                </div>
                                <div className="flex items-end justify-between mt-1">
                                    <span className="text-xs text-on-surface-variant">{gestor.cantidad_visitas} visitas</span>
                                    <div className="text-right">
                                        <span className="font-black text-primary text-lg leading-none">{gestor.total_personas}</span>
                                        <span className="text-[9px] uppercase text-outline block">personas</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
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

            {/* ── Provincias + Origen ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Provincias de Argentina */}
                <div className="bg-white p-8 rounded-3xl border border-outline-variant shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                        <span className="material-symbols-outlined text-primary">map</span>
                        <h3 className="font-h3">Provincias de Argentina</h3>
                    </div>
                    {!stats.desglosePorProvincia || stats.desglosePorProvincia.length === 0 ? (
                        <div className="text-center text-outline py-10">Sin datos de provincia en este período.</div>
                    ) : (() => {
                        const maxProv = Math.max(...stats.desglosePorProvincia.map((p: any) => parseInt(p.total_personas)));
                        return (
                            <div className="space-y-4">
                                {stats.desglosePorProvincia.map((prov: any, i: number) => {
                                    const pct = maxProv > 0 ? Math.round((parseInt(prov.total_personas) / maxProv) * 100) : 0;
                                    return (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className="w-28 text-xs font-semibold text-on-surface-variant text-right shrink-0 truncate" title={prov.provincia}>
                                                {prov.provincia}
                                            </div>
                                            <div className="flex-1 h-3 bg-surface-container rounded-full overflow-hidden">
                                                <div className={`h-full ${paleta[i % paleta.length]} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                                            </div>
                                            <div className="text-right shrink-0">
                                                <span className="font-black text-on-surface text-sm">{prov.total_personas}</span>
                                                <span className="text-[10px] text-outline ml-1">pers.</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })()}
                </div>

                {/* Gráfico de Torta: Origen (Argentina vs Extranjeros) */}
                <div className="bg-white p-8 rounded-3xl border border-outline-variant shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                        <span className="material-symbols-outlined text-primary">public</span>
                        <h3 className="font-h3">Origen de Visitantes</h3>
                    </div>
                    {!stats.origenVisitantes || stats.origenVisitantes.length === 0 ? (
                        <div className="text-center text-outline py-10">Sin datos de origen en este período.</div>
                    ) : (() => {
                        const totalOrigen = stats.origenVisitantes.reduce((acc: number, o: any) => acc + parseInt(o.total_personas), 0);
                        // Calcular segmentos para SVG donut
                        let acum = 0;
                        const radio = 60, cx = 80, cy = 80, grosor = 28;
                        const circunferencia = 2 * Math.PI * radio;
                        const segmentos = stats.origenVisitantes.map((o: any, i: number) => {
                            const pct = totalOrigen > 0 ? parseInt(o.total_personas) / totalOrigen : 0;
                            const offset = circunferencia * (1 - acum);
                            const dash = circunferencia * pct;
                            acum += pct;
                            const coloresArr = ['#3B82F6', '#F59E0B', '#10B981', '#EF4444'];
                            return { ...o, pct, offset, dash, color: coloresArr[i % coloresArr.length] };
                        });
                        return (
                            <div className="flex flex-col items-center gap-6">
                                <div className="relative">
                                    <svg width="160" height="160" viewBox="0 0 160 160">
                                        {segmentos.map((seg: any, i: number) => (
                                            <circle
                                                key={i}
                                                cx={cx} cy={cy} r={radio}
                                                fill="none"
                                                stroke={seg.color}
                                                strokeWidth={grosor}
                                                strokeDasharray={`${seg.dash} ${circunferencia - seg.dash}`}
                                                strokeDashoffset={seg.offset}
                                                strokeLinecap="butt"
                                                style={{ transition: 'stroke-dasharray 0.5s ease' }}
                                                transform={`rotate(-90 ${cx} ${cy})`}
                                            />
                                        ))}
                                        <text x={cx} y={cy - 8} textAnchor="middle" className="fill-on-surface" style={{ fontSize: 20, fontWeight: 900, fill: '#1c1b1f' }}>
                                            {totalOrigen}
                                        </text>
                                        <text x={cx} y={cy + 10} textAnchor="middle" style={{ fontSize: 9, fill: '#6b7280' }}>personas</text>
                                    </svg>
                                </div>
                                <div className="w-full space-y-3">
                                    {segmentos.map((seg: any, i: number) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                                            <span className="flex-1 text-sm font-semibold text-on-surface">{seg.origen}</span>
                                            <span className="font-black text-sm" style={{ color: seg.color }}>{Math.round(seg.pct * 100)}%</span>
                                            <span className="text-xs text-outline">({seg.total_personas} pers. · {seg.cantidad_visitas} visitas)</span>
                                        </div>
                                    ))}
                                    <p className="text-xs text-outline text-right pt-2 border-t border-outline-variant">
                                        Total: <span className="font-bold text-on-surface">{totalOrigen} personas</span>
                                    </p>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            </div>

            {/* ── Localidades ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Localidades de Entre Ríos */}
                <div className="bg-white p-8 rounded-3xl border border-outline-variant shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                        <span className="material-symbols-outlined text-primary">location_on</span>
                        <h3 className="font-h3">Localidades — Entre Ríos</h3>
                    </div>
                    {!stats.localidadesEntreRios || stats.localidadesEntreRios.length === 0 ? (
                        <div className="text-center text-outline py-10">Sin datos de localidades de Entre Ríos en este período.</div>
                    ) : (() => {
                        const maxER = Math.max(...stats.localidadesEntreRios.map((l: any) => parseInt(l.total_personas)));
                        return (
                            <div className="space-y-4">
                                {stats.localidadesEntreRios.map((loc: any, i: number) => {
                                    const pct = maxER > 0 ? Math.round((parseInt(loc.total_personas) / maxER) * 100) : 0;
                                    return (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className="w-28 text-xs font-semibold text-on-surface-variant text-right shrink-0 truncate" title={loc.localidad}>
                                                {loc.localidad}
                                            </div>
                                            <div className="flex-1 h-3 bg-surface-container rounded-full overflow-hidden">
                                                <div className={`h-full ${paleta[i % paleta.length]} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                                            </div>
                                            <div className="text-right shrink-0">
                                                <span className="font-black text-on-surface text-sm">{loc.total_personas}</span>
                                                <span className="text-[10px] text-outline ml-1">pers.</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })()}
                </div>

                {/* Localidades de Santa Fe */}
                <div className="bg-white p-8 rounded-3xl border border-outline-variant shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                        <span className="material-symbols-outlined text-primary">location_on</span>
                        <h3 className="font-h3">Localidades — Santa Fe</h3>
                    </div>
                    {!stats.localidadesSantaFe || stats.localidadesSantaFe.length === 0 ? (
                        <div className="text-center text-outline py-10">Sin datos de localidades de Santa Fe en este período.</div>
                    ) : (() => {
                        const maxSF = Math.max(...stats.localidadesSantaFe.map((l: any) => parseInt(l.total_personas)));
                        return (
                            <div className="space-y-4">
                                {stats.localidadesSantaFe.map((loc: any, i: number) => {
                                    const pct = maxSF > 0 ? Math.round((parseInt(loc.total_personas) / maxSF) * 100) : 0;
                                    return (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className="w-28 text-xs font-semibold text-on-surface-variant text-right shrink-0 truncate" title={loc.localidad}>
                                                {loc.localidad}
                                            </div>
                                            <div className="flex-1 h-3 bg-surface-container rounded-full overflow-hidden">
                                                <div className={`h-full ${paleta[i % paleta.length]} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                                            </div>
                                            <div className="text-right shrink-0">
                                                <span className="font-black text-on-surface text-sm">{loc.total_personas}</span>
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

    const [exportandoRango, setExportandoRango] = useState(false);
    const [exportandoMensual, setExportandoMensual] = useState(false);

    const handleExportar = async () => {
        setExportandoMensual(true);
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
        } finally {
            setExportandoMensual(false);
        }
    };

    const handleExportarRango = async () => {
        if (!rangoDesde || !rangoHasta) return;
        setExportandoRango(true);
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/estadisticas/exportar/rango?desde=${rangoDesde}&hasta=${rangoHasta}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            if (!response.ok) throw new Error('Error al generar el reporte por rango');
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Reporte_${rangoDesde}_a_${rangoHasta}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Error exportando rango:', err);
        } finally {
            setExportandoRango(false);
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
                                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-outline-variant">
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-primary">calendar_month</span>
                                            <p className="font-bold text-on-surface">
                                                Período: <span className="text-primary">{formatFechaLabel(rangoDesde)}</span>
                                                <span className="mx-2 text-outline">→</span>
                                                <span className="text-primary">{formatFechaLabel(rangoHasta)}</span>
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleExportarRango}
                                            disabled={exportandoRango}
                                            className="flex items-center gap-2 px-4 py-2 border border-outline-variant bg-white hover:bg-surface-container hover:border-primary/40 text-on-surface-variant hover:text-primary rounded-xl font-bold transition-all shadow-sm text-xs disabled:opacity-50"
                                        >
                                            <span className={`material-symbols-outlined text-[16px] ${exportandoRango ? 'animate-spin' : ''}`}>
                                                {exportandoRango ? 'progress_activity' : 'print'}
                                            </span>
                                            {exportandoRango ? 'Exportando...' : 'Exportar PDF'}
                                        </button>
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
                    <h1 className="font-h1 text-h1 text-on-surface">Estadísticas</h1>
                    <p className="font-body-md text-on-surface-variant">Indicadores clave de rendimiento (KPIs) y analíticas del sistema.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleExportar}
                        disabled={exportandoMensual}
                        className="flex items-center gap-2 px-4 py-2 border border-outline-variant bg-white hover:bg-surface-container hover:border-primary/40 text-on-surface-variant hover:text-primary rounded-xl font-bold transition-all shadow-sm disabled:opacity-50"
                        title="Exportar reporte mensual PDF"
                    >
                        <span className={`material-symbols-outlined text-[18px] ${exportandoMensual ? 'animate-spin' : ''}`}>
                            {exportandoMensual ? 'progress_activity' : 'print'}
                        </span>
                        {exportandoMensual ? 'Exportando...' : 'Exportar Mensual'}
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