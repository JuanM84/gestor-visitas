import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export const DashboardAdmin = () => {
    const { token } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [mesActual, setMesActual] = useState(new Date().getMonth() + 1);
    const [anioActual, setAnioActual] = useState(new Date().getFullYear());

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

    if (loading || !stats) return <div className="p-10 text-center animate-pulse">Cargando métricas gerenciales...</div>;

    // Calcular el máximo del gráfico para escalar las barras
    const maxPersonas = Math.max(...stats.evolucion.map((e: any) => parseInt(e.personas)), 1);

    return (
        <div className="flex flex-col max-w-[1200px] w-full mx-auto pb-12">

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

                    <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-2xl border border-outline-variant shadow-sm">
                        <button onClick={handleMesAnterior} className="p-2 hover:bg-surface-container rounded-lg"><span className="material-symbols-outlined">chevron_left</span></button>
                        <span className="font-bold text-primary min-w-[120px] text-center">{nombresMeses[mesActual - 1]} {anioActual}</span>
                        <button onClick={handleMesSiguiente} className="p-2 hover:bg-surface-container rounded-lg"><span className="material-symbols-outlined">chevron_right</span></button>
                    </div>
                </div>
            </div>

            {/* 1. KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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

                {/* 2. Gráfico de Evolución (CSS-Based) */}
                <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-outline-variant shadow-sm">
                    <h3 className="font-h3 mb-6">Evolución de Ocupación</h3>
                    {stats.evolucion.length === 0 ? (
                        <div className="text-center text-outline py-10">No hay datos registrados en este mes.</div>
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

                {/* 3. Ranking de Gestores */}
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
        </div>
    );
};