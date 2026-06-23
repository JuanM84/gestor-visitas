import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../utils/cn';
import { BADGE_ESTADO } from '../utils/visitaTypes';
import { useAuth } from '../context/AuthContext';

export const Listado = () => {
    const navigate = useNavigate();
    const { token } = useAuth();

    const [desde, setDesde] = useState('');
    const [hasta, setHasta] = useState('');
    const [visitas, setVisitas] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [exportando, setExportando] = useState(false);
    const [buscado, setBuscado] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [filtroEstados, setFiltroEstados] = useState({
        Realizada: true,
        Agendada: true,
        Cancelada: true
    });

    const visitasFiltradas = visitas.filter(v => {
        let estadoNormalizado = v.estado;
        if (estadoNormalizado === 'No realizada') {
            estadoNormalizado = 'Agendada';
        }
        return filtroEstados[estadoNormalizado as keyof typeof filtroEstados] ?? true;
    });

    const handleBuscar = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!desde || !hasta) return;
        if (desde > hasta) {
            setError('La fecha "Desde" debe ser anterior o igual a la fecha "Hasta".');
            return;
        }

        setError(null);
        setLoading(true);
        setBuscado(true);

        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/visitas/rango?desde=${desde}&hasta=${hasta}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Error al obtener el listado de visitas.');
            }
            const data = await res.json();
            setVisitas(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleExportarPDF = async () => {
        if (!desde || !hasta) return;
        setExportando(true);
        try {
            const estadosSeleccionados = Object.entries(filtroEstados)
                .filter(([_, value]) => value)
                .map(([key]) => key)
                .join(',');

            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/estadisticas/exportar/rango?desde=${desde}&hasta=${hasta}&estados=${estadosSeleccionados}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            if (!res.ok) throw new Error('Error al generar el PDF de listado');
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Reporte_Visitas_${desde}_a_${hasta}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Error exportando listado:', err);
            alert('No se pudo generar el reporte PDF.');
        } finally {
            setExportando(false);
        }
    };

    const handleDescargarComprobante = async (visitaId: string) => {
        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/estadisticas/exportar/visita/${visitaId}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            if (!res.ok) throw new Error('Error al generar el comprobante PDF');
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;

            // Formatear fecha para el nombre del archivo (formato DD-MM-AAAA)
            const visitaAsociada = visitas.find(v => String(v.id) === String(visitaId));
            const rawFecha = visitaAsociada?.fecha || '';
            const dateStr = rawFecha.includes('T') ? rawFecha.split('T')[0] : rawFecha;
            const parts = dateStr.split('-');
            const fechaStr = parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : dateStr;

            a.download = `Comprobante_visita_${fechaStr}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Error al reimprimir comprobante:', err);
            alert('No se pudo generar el comprobante de visita.');
        }
    };

    const formatFecha = (f: string) => {
        if (!f) return '';
        const dateStr = f.includes('T') ? f.split('T')[0] : f;
        const parts = dateStr.split('-');
        if (parts.length !== 3) return f;
        const [y, m, d] = parts;
        return `${d}/${m}/${y}`;
    };

    const inputStyles = "w-full px-3 h-10 rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none font-body-sm text-on-surface transition-all";

    return (
        <div className="flex flex-col max-w-[1440px] w-full mx-auto">
            {/* Cabecera */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-md mb-lg">
                <div>
                    <h1 className="font-h1 text-h1 text-on-surface mb-xs flex items-center gap-2">
                        <span className="material-symbols-outlined text-[32px] text-primary">print</span>
                        Listado de Visitas
                    </h1>
                    <p className="font-body-md text-on-surface-variant">Genere y exporte cronogramas o listados personalizados de visitas en un rango de fechas.</p>
                </div>
            </div>

            {/* Panel de Filtros por Rango */}
            <form onSubmit={handleBuscar} className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm border border-outline-variant mb-6">
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label className="block text-xs font-bold uppercase text-outline mb-1.5">Fecha Desde</label>
                        <input
                            type="date"
                            required
                            className={inputStyles}
                            value={desde}
                            onChange={(e) => {
                                setDesde(e.target.value);
                                setError(null);
                            }}
                        />
                    </div>
                    <div className="flex-1 w-full">
                        <label className="block text-xs font-bold uppercase text-outline mb-1.5">Fecha Hasta</label>
                        <input
                            type="date"
                            required
                            className={inputStyles}
                            value={hasta}
                            min={desde}
                            onChange={(e) => {
                                setHasta(e.target.value);
                                setError(null);
                            }}
                        />
                    </div>
                    <div className="flex w-full sm:w-auto gap-3">
                        <button
                            type="submit"
                            disabled={loading || exportando}
                            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-bold hover:bg-primary/95 active:scale-[0.98] transition-all shadow-sm text-sm disabled:opacity-60 h-10 whitespace-nowrap"
                        >
                            {loading ? (
                                <><span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span> Buscando...</>
                            ) : (
                                <><span className="material-symbols-outlined text-[18px]">search</span> Buscar</>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={handleExportarPDF}
                            disabled={loading || exportando || !desde || !hasta}
                            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-primary text-primary rounded-xl font-bold hover:bg-primary/5 active:scale-[0.98] transition-all shadow-sm text-sm disabled:opacity-50 h-10 whitespace-nowrap"
                        >
                            {exportando ? (
                                <><span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span> Generando...</>
                            ) : (
                                <><span className="material-symbols-outlined text-[18px]">picture_as_pdf</span> Imprimir PDF</>
                            )}
                        </button>
                    </div>
                </div>

                {/* Checkboxes de Estado */}
                <div className="mt-5 pt-4 border-t border-outline-variant/60 flex flex-col sm:flex-row sm:items-center gap-4">
                    <span className="text-xs font-bold uppercase text-outline tracking-wider">Filtrar por Estado:</span>
                    <div className="flex flex-wrap gap-5">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary accent-primary cursor-pointer transition-all"
                                checked={filtroEstados.Realizada}
                                onChange={(e) => setFiltroEstados({ ...filtroEstados, Realizada: e.target.checked })}
                            />
                            <span className="text-sm font-semibold text-on-surface flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#137333]"></span>
                                Realizada
                            </span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary accent-primary cursor-pointer transition-all"
                                checked={filtroEstados.Agendada}
                                onChange={(e) => setFiltroEstados({ ...filtroEstados, Agendada: e.target.checked })}
                            />
                            <span className="text-sm font-semibold text-on-surface flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                                Agendada
                            </span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary accent-primary cursor-pointer transition-all"
                                checked={filtroEstados.Cancelada}
                                onChange={(e) => setFiltroEstados({ ...filtroEstados, Cancelada: e.target.checked })}
                            />
                            <span className="text-sm font-semibold text-on-surface flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                                Cancelada
                            </span>
                        </label>
                    </div>
                </div>

                {error && (
                    <div className="mt-3 flex items-center gap-2 text-error text-sm font-semibold">
                        <span className="material-symbols-outlined text-[16px]">error</span>
                        {error}
                    </div>
                )}
            </form>

            {/* Listado y Tabla de Resultados */}
            <div className="bg-surface-container-lowest rounded-3xl shadow-sm border border-outline-variant overflow-hidden">
                {!buscado && !loading && (
                    <div className="py-20 text-center text-on-surface-variant">
                        <span className="material-symbols-outlined text-5xl text-outline mb-3 block">print_connect</span>
                        <p className="font-semibold text-lg text-on-surface">Consulta de Visitas por Rango</p>
                        <p className="text-sm text-outline mt-1 max-w-md mx-auto">Seleccione una fecha de inicio y una fecha de fin arriba y haga clic en "Buscar" para visualizar las visitas.</p>
                    </div>
                )}

                {loading && (
                    <div className="py-20 text-center text-outline animate-pulse">
                        <span className="material-symbols-outlined text-4xl animate-spin mb-3">progress_activity</span>
                        <p className="font-semibold text-sm">Obteniendo visitas del período...</p>
                    </div>
                )}

                {buscado && !loading && visitasFiltradas.length === 0 && (
                    <div className="py-20 text-center text-on-surface-variant">
                        <span className="material-symbols-outlined text-5xl text-outline mb-3 block">event_busy</span>
                        <p className="font-semibold text-lg text-on-surface">No se encontraron visitas</p>
                        <p className="text-sm text-outline mt-1 border-t border-outline-variant/10 pt-2">
                            {visitas.length === 0
                                ? `No hay registros de visitas agendadas entre el ${formatFecha(desde)} y el ${formatFecha(hasta)}.`
                                : 'Ninguna visita coincide con los filtros de estado seleccionados.'}
                        </p>
                    </div>
                )}

                {buscado && !loading && visitasFiltradas.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-surface-container-low border-b border-outline-variant">
                                <tr>
                                    <th className="p-4 font-bold text-on-surface whitespace-nowrap text-sm">Fecha y Hora</th>
                                    <th className="p-4 font-bold text-on-surface whitespace-nowrap text-sm">Tipo</th>
                                    <th className="p-4 font-bold text-on-surface whitespace-nowrap text-sm">Gestor / Institución</th>
                                    <th className="p-4 font-bold text-on-surface whitespace-nowrap text-sm">Grupo</th>
                                    <th className="p-4 font-bold text-on-surface whitespace-nowrap text-sm text-center">Personas</th>
                                    <th className="p-4 font-bold text-on-surface whitespace-nowrap text-sm">Estado</th>
                                    <th className="p-4 font-bold text-on-surface whitespace-nowrap text-sm text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="font-body-sm text-on-surface divide-y divide-outline-variant">
                                {visitasFiltradas.map((v) => (
                                    <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4">
                                            <div className="font-semibold text-on-surface">{formatFecha(v.fecha)}</div>
                                            <div className="text-on-surface-variant text-xs">{v.hora_inicio.slice(0,5)} hs</div>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 border border-outline-variant/30 text-on-surface-variant">
                                                {v.tipo}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-semibold text-on-surface">{v.gestor_nombre}</div>
                                            {v.institucion_nombre && (
                                                <div className="text-slate-500 text-xs truncate max-w-[200px]" title={v.institucion_nombre}>
                                                    🏢 {v.institucion_nombre}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="text-on-surface">{v.grupo_nombre}</div>
                                            <div className="text-[10px] text-outline uppercase tracking-wider">{v.tipo_visitante}</div>
                                        </td>
                                        <td className="p-4 text-center font-bold text-sm text-primary">
                                            {v.cantidad_personas}
                                        </td>
                                        <td className="p-4">
                                            <span className={cn(
                                                "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                                BADGE_ESTADO[v.estado] ?? 'bg-surface-variant text-on-surface-variant border border-outline-variant/30'
                                            )}>
                                                {v.estado}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-1">
                                                <button
                                                    onClick={() => navigate(`/visitas/${v.id}`)}
                                                    className="p-1.5 text-outline hover:text-primary transition-colors rounded-lg hover:bg-slate-100"
                                                    title="Ver Detalle"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">visibility</span>
                                                </button>
                                                {v.estado !== 'Cancelada' && (
                                                    <button
                                                        onClick={() => handleDescargarComprobante(v.id)}
                                                        className="p-1.5 text-outline hover:text-secondary transition-colors rounded-lg hover:bg-slate-100"
                                                        title="Imprimir Comprobante"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">print</span>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {buscado && !loading && visitasFiltradas.length > 0 && (
                    <div className="p-4 border-t border-outline-variant bg-surface-container-low flex items-center justify-between text-xs text-on-surface-variant">
                        <div>
                            Total del período: <span className="font-bold text-on-surface">{visitasFiltradas.length} visitas</span> con <span className="font-bold text-on-surface">{visitasFiltradas.reduce((acc, v) => acc + parseInt(v.cantidad_personas), 0)} personas</span> en total.
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
