import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { cn } from '../utils/cn';

export const Informes = () => {
    const { usuario, token } = useAuth();
    const navigate = useNavigate();

    // Redirección si no es admin
    useEffect(() => {
        if (usuario && usuario.rol !== 'Admin') {
            navigate('/dashboard');
        }
    }, [usuario, navigate]);

    const [titulo, setTitulo] = useState('');
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');
    const [activeTab, setActiveTab] = useState<'geograficas' | 'instituciones'>('geograficas');
    
    const [secciones, setSecciones] = useState({
        nacionales: true,
        extranjeros: false,
        entrerios: false,
        santafe: false,
        inst_nacionales: false,
        inst_niveles: true,
        inst_entrerios: false,
        inst_santafe: false,
        inst_cruces: false,
    });

    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleGenerarPDF = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validaciones
        if (!fechaDesde || !fechaHasta) {
            setError('Las fechas Desde y Hasta son obligatorias.');
            return;
        }

        if (fechaDesde > fechaHasta) {
            setError('La fecha "Desde" debe ser anterior o igual a la fecha "Hasta".');
            return;
        }

        const activeKeys = activeTab === 'geograficas'
            ? ['nacionales', 'extranjeros', 'entrerios', 'santafe']
            : ['inst_nacionales', 'inst_niveles', 'inst_entrerios', 'inst_santafe', 'inst_cruces'];

        const activeSecciones = Object.entries(secciones)
            .filter(([key, val]) => val && activeKeys.includes(key))
            .map(([key]) => key);

        if (activeSecciones.length === 0) {
            setError('Debe seleccionar al menos una estadística para incluir en el informe.');
            return;
        }

        setLoading(true);
        try {
            const isInstituciones = activeTab === 'instituciones';
            let finalTitulo = titulo.trim();
            if (isInstituciones) {
                if (finalTitulo) {
                    if (!finalTitulo.toLowerCase().endsWith(' - instituciones')) {
                        finalTitulo = `${finalTitulo} - Instituciones`;
                    }
                }
            }

            const queryParams = new URLSearchParams({
                desde: fechaDesde,
                hasta: fechaHasta,
                titulo: finalTitulo,
                secciones: activeSecciones.join(','),
            });

            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/estadisticas/exportar/informe?${queryParams.toString()}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Error al generar el informe');
            }

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            
            // Format name
            const formatName = (t: string) => t.trim().replace(/\s+/g, '_') || 'Informe';
            
            let displayTitle = finalTitulo;
            if (!displayTitle) {
                const formatFechaStr = (f: string) => {
                    const [y, m, d] = f.split('-');
                    return `${d}/${m}/${y}`;
                };
                displayTitle = `Informe ${formatFechaStr(fechaDesde)} - ${formatFechaStr(fechaHasta)}`;
                if (isInstituciones) {
                    displayTitle += ' - Instituciones';
                }
            }

            const fileName = `${formatName(displayTitle)}.pdf`;

            a.download = fileName;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err: any) {
            console.error('Error generando informe:', err);
            setError(err.message || 'No se pudo generar el informe de estadísticas.');
        } finally {
            setLoading(false);
        }
    };

    const activeKeys = activeTab === 'geograficas'
        ? ['nacionales', 'extranjeros', 'entrerios', 'santafe']
        : ['inst_nacionales', 'inst_niveles', 'inst_entrerios', 'inst_santafe', 'inst_cruces'];

    const noSeccionesSelected = Object.entries(secciones)
        .filter(([key, val]) => val && activeKeys.includes(key))
        .length === 0;

    const inpClass = "w-full h-11 px-4 rounded-xl border border-slate-200 bg-white outline-none focus:border-primary transition-all text-sm font-medium shadow-sm hover:border-slate-300";

    return (
        <div className="flex flex-col max-w-[850px] w-full mx-auto pb-12">
            {/* Header */}
            <div className="mb-8">
                <h1 className="font-h1 text-h1 text-on-surface">Confección de Informes</h1>
                <p className="font-body-md text-on-surface-variant">
                    Genere reportes estadísticos personalizados en formato PDF A4 horizontal para el período deseado.
                </p>
            </div>

            <form onSubmit={handleGenerarPDF} className="flex flex-col gap-8 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm animate-fade-in">
                {/* Tabs Selector */}
                <div className="flex border-b border-slate-200 -mx-8 px-8 -mt-2">
                    <button
                        type="button"
                        onClick={() => {
                            setActiveTab('geograficas');
                            setError(null);
                        }}
                        className={cn(
                            "py-3.5 px-6 font-bold text-sm border-b-2 transition-all flex items-center gap-2 -mb-[2px]",
                            activeTab === 'geograficas'
                                ? "border-primary text-primary"
                                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                        )}
                    >
                        <span className="material-symbols-outlined text-[20px]">public</span>
                        Geográficas
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setActiveTab('instituciones');
                            setError(null);
                        }}
                        className={cn(
                            "py-3.5 px-6 font-bold text-sm border-b-2 transition-all flex items-center gap-2 -mb-[2px]",
                            activeTab === 'instituciones'
                                ? "border-primary text-primary"
                                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                        )}
                    >
                        <span className="material-symbols-outlined text-[20px]">corporate_fare</span>
                        Instituciones
                    </button>
                </div>

                {error && (
                    <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-600 p-4 rounded-2xl text-sm font-semibold">
                        <span className="material-symbols-outlined text-[18px]">error</span>
                        {error}
                    </div>
                )}

                {/* Título del Informe (Opcional) */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                        Título del Informe <span className="text-[10px] text-slate-400 font-normal lowercase">(opcional)</span>
                    </label>
                    <input
                        type="text"
                        placeholder={
                            fechaDesde && fechaHasta
                                ? `Informe ${fechaDesde.split('-').reverse().join('/')} - ${fechaHasta.split('-').reverse().join('/')}${activeTab === 'instituciones' ? ' - Instituciones' : ''}`
                                : "Ingrese un título personalizado para el informe"
                        }
                        className={inpClass}
                        value={titulo}
                        onChange={e => setTitulo(e.target.value)}
                    />
                </div>

                {/* Rango de Fechas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Desde *</label>
                        <div className="relative">
                            <input
                                type="date"
                                required
                                className={inpClass}
                                value={fechaDesde}
                                onChange={e => {
                                    setFechaDesde(e.target.value);
                                    setError(null);
                                }}
                            />
                        </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Hasta *</label>
                        <div className="relative">
                            <input
                                type="date"
                                required
                                className={inpClass}
                                value={fechaHasta}
                                min={fechaDesde}
                                onChange={e => {
                                    setFechaHasta(e.target.value);
                                    setError(null);
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Checkboxes de Estadísticas */}
                <div className="flex flex-col gap-3 border-t border-slate-100 pt-6">
                    <label className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-2 block">
                        Estadísticas a Incluir *
                    </label>

                    {activeTab === 'geograficas' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Visitantes Nacionales */}
                            <label className={cn(
                                "flex flex-col gap-3 p-5 rounded-2xl border cursor-pointer transition-all hover:shadow-sm",
                                secciones.nacionales
                                    ? "border-primary bg-primary/5 text-primary"
                                    : "border-slate-200 bg-white text-slate-700 hover:border-primary/40"
                            )}>
                                <input
                                    type="checkbox"
                                    checked={secciones.nacionales}
                                    onChange={() => setSecciones({ ...secciones, nacionales: !secciones.nacionales })}
                                    className="hidden"
                                />
                                <div className="flex items-center justify-between">
                                    <span className={cn(
                                        "material-symbols-outlined text-3xl",
                                        secciones.nacionales ? "text-primary" : "text-slate-400"
                                    )}>flag</span>
                                    {secciones.nacionales && (
                                        <span className="material-symbols-outlined text-primary text-[22px]">check_circle</span>
                                    )}
                                </div>
                                <div>
                                    <p className="font-bold text-sm">Visitantes Nacionales</p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Muestra la cantidad de visitantes (personas) recibidos de provincias argentinas, en un gráfico de barras horizontales.
                                    </p>
                                </div>
                            </label>

                            {/* Visitantes Extranjeros */}
                            <label className={cn(
                                "flex flex-col gap-3 p-5 rounded-2xl border cursor-pointer transition-all hover:shadow-sm",
                                secciones.extranjeros
                                    ? "border-primary bg-primary/5 text-primary"
                                    : "border-slate-200 bg-white text-slate-700 hover:border-primary/40"
                            )}>
                                <input
                                    type="checkbox"
                                    checked={secciones.extranjeros}
                                    onChange={() => setSecciones({ ...secciones, extranjeros: !secciones.extranjeros })}
                                    className="hidden"
                                />
                                <div className="flex items-center justify-between">
                                    <span className={cn(
                                        "material-symbols-outlined text-3xl",
                                        secciones.extranjeros ? "text-primary" : "text-slate-400"
                                    )}>public</span>
                                    {secciones.extranjeros && (
                                        <span className="material-symbols-outlined text-primary text-[22px]">check_circle</span>
                                    )}
                                </div>
                                <div>
                                    <p className="font-bold text-sm">Visitantes Extranjeros</p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Muestra la cantidad de visitantes de otros países (fuera de Argentina) en un gráfico de barras horizontales.
                                    </p>
                                </div>
                            </label>

                            {/* Visitantes de Entre Ríos */}
                            <label className={cn(
                                "flex flex-col gap-3 p-5 rounded-2xl border cursor-pointer transition-all hover:shadow-sm",
                                secciones.entrerios
                                    ? "border-primary bg-primary/5 text-primary"
                                    : "border-slate-200 bg-white text-slate-700 hover:border-primary/40"
                            )}>
                                <input
                                    type="checkbox"
                                    checked={secciones.entrerios}
                                    onChange={() => setSecciones({ ...secciones, entrerios: !secciones.entrerios })}
                                    className="hidden"
                                />
                                <div className="flex items-center justify-between">
                                    <span className={cn(
                                        "material-symbols-outlined text-3xl",
                                        secciones.entrerios ? "text-primary" : "text-slate-400"
                                    )}>map</span>
                                    {secciones.entrerios && (
                                        <span className="material-symbols-outlined text-primary text-[22px]">check_circle</span>
                                    )}
                                </div>
                                <div>
                                    <p className="font-bold text-sm">Visitantes de Entre Ríos</p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Detalla los visitantes provenientes de localidades de la provincia de Entre Ríos en un gráfico de barras horizontales.
                                    </p>
                                </div>
                            </label>

                            {/* Visitantes de Santa Fe */}
                            <label className={cn(
                                "flex flex-col gap-3 p-5 rounded-2xl border cursor-pointer transition-all hover:shadow-sm",
                                secciones.santafe
                                    ? "border-primary bg-primary/5 text-primary"
                                    : "border-slate-200 bg-white text-slate-700 hover:border-primary/40"
                            )}>
                                <input
                                    type="checkbox"
                                    checked={secciones.santafe}
                                    onChange={() => setSecciones({ ...secciones, santafe: !secciones.santafe })}
                                    className="hidden"
                                />
                                <div className="flex items-center justify-between">
                                    <span className={cn(
                                        "material-symbols-outlined text-3xl",
                                        secciones.santafe ? "text-primary" : "text-slate-400"
                                    )}>location_on</span>
                                    {secciones.santafe && (
                                        <span className="material-symbols-outlined text-primary text-[22px]">check_circle</span>
                                    )}
                                </div>
                                <div>
                                    <p className="font-bold text-sm">Visitantes de Santa Fe</p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Detalla los visitantes provenientes de localidades de la provincia de Santa Fe en un gráfico de barras horizontales.
                                    </p>
                                </div>
                            </label>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Instituciones Nacionales */}
                            <label className={cn(
                                "flex flex-col gap-3 p-5 rounded-2xl border cursor-pointer transition-all hover:shadow-sm",
                                secciones.inst_nacionales
                                    ? "border-primary bg-primary/5 text-primary"
                                    : "border-slate-200 bg-white text-slate-700 hover:border-primary/40"
                            )}>
                                <input
                                    type="checkbox"
                                    checked={secciones.inst_nacionales}
                                    onChange={() => setSecciones({ ...secciones, inst_nacionales: !secciones.inst_nacionales })}
                                    className="hidden"
                                />
                                <div className="flex items-center justify-between">
                                    <span className={cn(
                                        "material-symbols-outlined text-3xl",
                                        secciones.inst_nacionales ? "text-primary" : "text-slate-400"
                                    )}>public</span>
                                    {secciones.inst_nacionales && (
                                        <span className="material-symbols-outlined text-primary text-[22px]">check_circle</span>
                                    )}
                                </div>
                                <div>
                                    <p className="font-bold text-sm">Instituciones Nacionales</p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Detalla los visitantes de instituciones agrupados por las provincias argentinas de origen.
                                    </p>
                                </div>
                            </label>

                            {/* Niveles Educativos */}
                            <label className={cn(
                                "flex flex-col gap-3 p-5 rounded-2xl border cursor-pointer transition-all hover:shadow-sm",
                                secciones.inst_niveles
                                    ? "border-primary bg-primary/5 text-primary"
                                    : "border-slate-200 bg-white text-slate-700 hover:border-primary/40"
                            )}>
                                <input
                                    type="checkbox"
                                    checked={secciones.inst_niveles}
                                    onChange={() => setSecciones({ ...secciones, inst_niveles: !secciones.inst_niveles })}
                                    className="hidden"
                                />
                                <div className="flex items-center justify-between">
                                    <span className={cn(
                                        "material-symbols-outlined text-3xl",
                                        secciones.inst_niveles ? "text-primary" : "text-slate-400"
                                    )}>school</span>
                                    {secciones.inst_niveles && (
                                        <span className="material-symbols-outlined text-primary text-[22px]">check_circle</span>
                                    )}
                                </div>
                                <div>
                                    <p className="font-bold text-sm">Niveles Educativos</p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Agrupa la cantidad de personas de instituciones por su nivel educativo en un gráfico de barras.
                                    </p>
                                </div>
                            </label>

                            {/* Entre Rios Localidades */}
                            <label className={cn(
                                "flex flex-col gap-3 p-5 rounded-2xl border cursor-pointer transition-all hover:shadow-sm",
                                secciones.inst_entrerios
                                    ? "border-primary bg-primary/5 text-primary"
                                    : "border-slate-200 bg-white text-slate-700 hover:border-primary/40"
                            )}>
                                <input
                                    type="checkbox"
                                    checked={secciones.inst_entrerios}
                                    onChange={() => setSecciones({ ...secciones, inst_entrerios: !secciones.inst_entrerios })}
                                    className="hidden"
                                />
                                <div className="flex items-center justify-between">
                                    <span className={cn(
                                        "material-symbols-outlined text-3xl",
                                        secciones.inst_entrerios ? "text-primary" : "text-slate-400"
                                    )}>map</span>
                                    {secciones.inst_entrerios && (
                                        <span className="material-symbols-outlined text-primary text-[22px]">check_circle</span>
                                    )}
                                </div>
                                <div>
                                    <p className="font-bold text-sm">Entre Ríos (Localidades)</p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Detalla los visitantes de instituciones según las localidades de la provincia de Entre Ríos.
                                    </p>
                                </div>
                            </label>

                            {/* Santa Fe Localidades */}
                            <label className={cn(
                                "flex flex-col gap-3 p-5 rounded-2xl border cursor-pointer transition-all hover:shadow-sm",
                                secciones.inst_santafe
                                    ? "border-primary bg-primary/5 text-primary"
                                    : "border-slate-200 bg-white text-slate-700 hover:border-primary/40"
                            )}>
                                <input
                                    type="checkbox"
                                    checked={secciones.inst_santafe}
                                    onChange={() => setSecciones({ ...secciones, inst_santafe: !secciones.inst_santafe })}
                                    className="hidden"
                                />
                                <div className="flex items-center justify-between">
                                    <span className={cn(
                                        "material-symbols-outlined text-3xl",
                                        secciones.inst_santafe ? "text-primary" : "text-slate-400"
                                    )}>location_on</span>
                                    {secciones.inst_santafe && (
                                        <span className="material-symbols-outlined text-primary text-[22px]">check_circle</span>
                                    )}
                                </div>
                                <div>
                                    <p className="font-bold text-sm">Santa Fe (Localidades)</p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Detalla los visitantes de instituciones según las localidades de la provincia de Santa Fe.
                                    </p>
                                </div>
                            </label>

                            {/* Cruces de Tunel */}
                            <label className={cn(
                                "flex flex-col gap-3 p-5 rounded-2xl border cursor-pointer transition-all hover:shadow-sm",
                                secciones.inst_cruces
                                    ? "border-primary bg-primary/5 text-primary"
                                    : "border-slate-200 bg-white text-slate-700 hover:border-primary/40"
                            )}>
                                <input
                                    type="checkbox"
                                    checked={secciones.inst_cruces}
                                    onChange={() => setSecciones({ ...secciones, inst_cruces: !secciones.inst_cruces })}
                                    className="hidden"
                                />
                                <div className="flex items-center justify-between">
                                    <span className={cn(
                                        "material-symbols-outlined text-3xl",
                                        secciones.inst_cruces ? "text-primary" : "text-slate-400"
                                    )}>directions_car</span>
                                    {secciones.inst_cruces && (
                                        <span className="material-symbols-outlined text-primary text-[22px]">check_circle</span>
                                    )}
                                </div>
                                <div>
                                    <p className="font-bold text-sm">Cruces de Túnel</p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Lista detalladamente las visitas institucionales que realizaron el cruce de túnel, indicando fecha, nombre, localidad y provincia.
                                    </p>
                                </div>
                            </label>
                        </div>
                    )}
                </div>

                {/* Botón de envío */}
                <div className="border-t border-slate-100 pt-6 flex justify-end">
                    <button
                        type="submit"
                        disabled={loading || noSeccionesSelected}
                        className="flex items-center justify-center gap-2 px-8 py-3.5 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 hover:shadow-md transition-all text-sm disabled:opacity-60 disabled:pointer-events-none min-w-[200px]"
                    >
                        {loading ? (
                            <>
                                <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                                Confeccionando PDF...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                                Generar y Descargar PDF
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};
