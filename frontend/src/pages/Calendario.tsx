import { useEffect, useState } from 'react';
import { Button } from '../components/ui/Button';
import { cn } from '../utils/cn';
import { Link } from 'react-router-dom';
import { BADGE_ESTADO } from '../utils/visitaTypes';
import { useAuth } from '../context/AuthContext';

export const Calendario = () => {
    const [fechaActual, setFechaActual] = useState(new Date());
    const [datosMes, setDatosMes] = useState<Record<number, any>>({});
    const [loading, setLoading] = useState(false);

    // --- NUEVOS ESTADOS PARA EL MODAL ---
    const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null);
    const [visitasDelDia, setVisitasDelDia] = useState<any[]>([]);
    const [loadingVisitas, setLoadingVisitas] = useState(false);

    // --- NUEVOS ESTADOS PARA EL MODAL DE IMPRESIÓN ---
    const [modalImprimirAbierto, setModalImprimirAbierto] = useState(false);
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');
    const [errorImpresion, setErrorImpresion] = useState<string | null>(null);
    const [generandoPDF, setGenerandoPDF] = useState(false);

    const { token } = useAuth();
    const anio = fechaActual.getFullYear();
    const mes = fechaActual.getMonth();

    const diasEnElMes = new Date(anio, mes + 1, 0).getDate();
    const primerDiaDelMes = new Date(anio, mes, 1).getDay();
    const diaInicio = primerDiaDelMes === 0 ? 6 : primerDiaDelMes - 1;

    const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    useEffect(() => {
        const fetchDatosCalendario = async () => {
            setLoading(true);
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/visitas/calendario?anio=${anio}&mes=${mes + 1}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    const data = await response.json();
                    setDatosMes(data);
                }
            } catch (error) {
                console.error('Error cargando el calendario:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDatosCalendario();
    }, [anio, mes, token]);

    const obtenerEstadoDia = (dia: number) => {
        if (datosMes[dia]) return datosMes[dia];
        return { estado: 'disponible', texto: 'Libre', visitas: 0 };
    };

    const mesAnterior = () => setFechaActual(new Date(anio, mes - 1, 1));
    const mesSiguiente = () => setFechaActual(new Date(anio, mes + 1, 1));
    const mesActualStr = new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' }).format(fechaActual);

    // --- FUNCIÓN: AL HACER CLIC EN UN DÍA ---
    const handleDiaClick = async (dia: number) => {
        const estadoDia = obtenerEstadoDia(dia);

        // No hacer nada si el día está inhabilitado
        if (estadoDia.estado === 'inhabilitado') {
            return;
        }

        // Formateamos la fecha a YYYY-MM-DD para el backend
        const fechaStr = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
        setDiaSeleccionado(fechaStr);
        setLoadingVisitas(true);

        try {
            // Usamos la ruta del Dashboard que ya teníamos creada
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/visitas?fecha=${fechaStr}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setVisitasDelDia(data.data || []);
            }
        } catch (error) {
            console.error('Error al cargar detalle del día:', error);
        } finally {
            setLoadingVisitas(false);
        }
    };

    const cerrarModal = () => {
        setDiaSeleccionado(null);
        setVisitasDelDia([]);
    };

    const handleImprimirListado = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorImpresion(null);

        if (!fechaDesde || !fechaHasta) {
            setErrorImpresion('Debes seleccionar ambas fechas.');
            return;
        }

        const desdeDate = new Date(fechaDesde);
        const hastaDate = new Date(fechaHasta);

        if (desdeDate >= hastaDate) {
            setErrorImpresion('La fecha "Desde" debe ser menor que la fecha "Hasta".');
            return;
        }

        setGenerandoPDF(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/estadisticas/exportar/rango?desde=${fechaDesde}&hasta=${fechaHasta}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error('Error al generar el PDF.');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Reporte_Visitas_${fechaDesde}_a_${fechaHasta}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            
            // Cerrar modal
            setModalImprimirAbierto(false);
            setFechaDesde('');
            setFechaHasta('');
        } catch (error) {
            console.error('Error generando el listado PDF:', error);
            setErrorImpresion('Hubo un error al intentar generar el archivo PDF.');
        } finally {
            setGenerandoPDF(false);
        }
    };

    return (
        <div className="flex flex-col max-w-[1440px] w-full mx-auto relative">
            {/* Cabecera */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-md mb-lg">
                <div>
                    <h1 className="font-h1 text-h1 text-on-surface mb-xs capitalize">Calendario Operativo</h1>
                    <p className="font-body-md text-on-surface-variant">Visualización de ocupación mensual y gestión de fechas.</p>
                </div>
                <div className="flex gap-sm">
                    <Button variant="outline" onClick={() => setModalImprimirAbierto(true)}>
                        <span className="material-symbols-outlined text-[18px]">print</span> Imprimir Listado
                    </Button>
                    <Link to="/nueva-visita" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary-container transition-all">
                        <span className="material-symbols-outlined text-[18px]">add</span> Agregar Visita
                    </Link>
                </div>
            </div>

            {/* Calendario */}
            <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant overflow-hidden relative">
                {loading && (
                    <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
                        <span className="animate-spin material-symbols-outlined text-4xl text-primary">sync</span>
                    </div>
                )}

                {/* Navegación */}
                <div className="flex items-center justify-between p-6 border-b border-surface-container-highest">
                    <h2 className="font-h3 text-h3 capitalize text-on-surface">{mesActualStr}</h2>
                    <div className="flex items-center gap-2">
                        <button onClick={mesAnterior} className="p-2 rounded-lg hover:bg-surface-container-low transition-colors text-on-surface-variant"><span className="material-symbols-outlined">chevron_left</span></button>
                        <button onClick={() => setFechaActual(new Date())} className="px-4 py-2 font-label-md text-primary hover:bg-primary-container/50 rounded-lg transition-colors">Hoy</button>
                        <button onClick={mesSiguiente} className="p-2 rounded-lg hover:bg-surface-container-low transition-colors text-on-surface-variant"><span className="material-symbols-outlined">chevron_right</span></button>
                    </div>
                </div>

                {/* Grilla */}
                <div className="p-6">
                    <div className="grid grid-cols-7 gap-4 mb-4">
                        {diasSemana.map(dia => <div key={dia} className="text-center font-label-md text-on-surface-variant uppercase tracking-wider">{dia}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-4">
                        {Array.from({ length: diaInicio }).map((_, i) => (
                            <div key={`empty-${i}`} className="min-h-[120px] rounded-xl border border-dashed border-outline-variant/50 bg-surface-bright/50"></div>
                        ))}

                        {Array.from({ length: diasEnElMes }).map((_, i) => {
                            const dia = i + 1;
                            const { estado, texto, visitas } = obtenerEstadoDia(dia);
                            const esHoy = new Date().getDate() === dia && new Date().getMonth() === mes && new Date().getFullYear() === anio;
                            const isClickable = estado !== 'inhabilitado';

                            // Fecha del día comparada con hoy (sin horas)
                            const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
                            const esPasado = new Date(anio, mes, dia) < hoy;

                            // Para fechas pasadas: ocultar "Slots Disponibles" y "Libre"
                            const mostrarBadge = !(esPasado && (estado === 'parcial' || estado === 'disponible'));
                            const textoBadge = (esPasado && estado === 'parcial') ? 'Con visitas' : texto;
                            const estilosBadge = cn(
                                "text-[11px] px-2 py-1 rounded font-bold uppercase tracking-wider truncate",
                                estado === 'lleno' && "bg-error-container text-on-error-container",
                                estado === 'parcial' && !esPasado && "bg-[#e6f4ea] text-[#137333]",
                                estado === 'parcial' && esPasado && "bg-surface-container text-outline",
                                estado === 'inhabilitado' && "bg-surface-variant text-on-surface-variant",
                                estado === 'disponible' && !esPasado && "bg-surface-container-lowest text-outline border border-dashed border-outline/30"
                            );

                            return (
                                <div
                                    key={dia}
                                    onClick={() => handleDiaClick(dia)} // Vinculamos el click
                                    className={cn(
                                        "min-h-[120px] p-3 rounded-xl border flex flex-col transition-all",
                                        estado === 'inhabilitado' ? "bg-surface-container-low border-surface-container opacity-60" : "bg-white border-outline-variant/50",
                                        isClickable ? "hover:border-primary/50 hover:shadow-md cursor-pointer" : "cursor-default",
                                        esHoy && "ring-2 ring-primary border-transparent"
                                    )}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={cn("w-8 h-8 flex items-center justify-center rounded-full font-label-md", esHoy ? "bg-primary text-white" : "text-on-surface")}>{dia}</span>
                                    </div>
                                    <div className="mt-auto flex flex-col gap-1">
                                        {visitas > 0 && estado !== 'inhabilitado' && (
                                            <div className="text-xs font-medium text-on-surface-variant">{visitas} personas</div>
                                        )}
                                        {mostrarBadge && (
                                            <div className={estilosBadge}>
                                                {textoBadge}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* --- MODAL DE DETALLE DEL DÍA --- */}
            {diaSeleccionado && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-surface rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">

                        {/* Header del Modal */}
                        <div className="flex justify-between items-center p-6 border-b border-surface-container">
                            <div>
                                <h3 className="font-h2 text-h2 text-on-surface">Detalle del Día</h3>
                                <p className="font-body-md text-primary mt-1">
                                    {new Date(diaSeleccionado + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                </p>
                            </div>
                            <button onClick={cerrarModal} className="p-2 hover:bg-surface-container-low rounded-full text-on-surface-variant transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        {/* Cuerpo del Modal (Lista de Visitas) */}
                        <div className="p-6 overflow-y-auto flex-1 bg-surface-container-lowest">
                            {loadingVisitas ? (
                                <div className="flex flex-col items-center justify-center py-12 gap-3 text-outline">
                                    <span className="animate-spin material-symbols-outlined text-3xl text-primary">sync</span>
                                    <span>Cargando visitas...</span>
                                </div>
                            ) : visitasDelDia.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
                                    <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center">
                                        <span className="material-symbols-outlined text-3xl text-outline">event_available</span>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-on-surface">Sin visitas registradas</p>
                                        <p className="text-sm text-outline mt-1">No hay visitas agendadas para este día.</p>
                                    </div>
                                    <Link
                                        to={`/nueva-visita?fecha=${diaSeleccionado}`}
                                        onClick={cerrarModal}
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-all"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">add</span>
                                        Agregar visita para este día
                                    </Link>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-4">
                                    {visitasDelDia.map((visita: any) => {
                                        const esCancelada = visita.estado === 'Cancelada';
                                        return (
                                            <div key={visita.id} className={cn(
                                                "p-4 border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white transition-colors",
                                                esCancelada
                                                    ? "border-red-200 opacity-75 hover:border-red-300"
                                                    : "border-outline-variant hover:border-primary/30"
                                            )}>
                                                <div className="flex gap-4 items-center">
                                                    <div className={cn(
                                                        "w-12 h-12 rounded-full flex items-center justify-center font-bold text-md border",
                                                        esCancelada
                                                            ? "bg-red-50 text-red-400 border-red-200 line-through"
                                                            : "bg-sky-100 text-sky-800 border-sky-200"
                                                    )}>
                                                        {visita.hora_inicio.slice(0, 5)}
                                                    </div>

                                                    <div>
                                                        <div className="flex items-center gap-2 mb-0.5">
                                                            <h4 className={cn(
                                                                "font-bold text-on-surface text-lg",
                                                                esCancelada && "line-through text-outline"
                                                            )}>{visita.grupo_nombre}</h4>
                                                            {visita.tiene_cruce_tunel && (
                                                                <span
                                                                    className="material-symbols-outlined text-amber-600 text-[18px]"
                                                                    title="Realiza cruce del túnel"
                                                                >swap_horiz</span>
                                                            )}
                                                            {visita.tiene_discapacidad && (
                                                                <span
                                                                    className="material-symbols-outlined text-secondary text-[18px]"
                                                                    title="Requiere accesibilidad"
                                                                >accessible_forward</span>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-on-surface-variant flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-[16px]">domain</span>
                                                            {visita.gestor_nombre}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 sm:gap-1">
                                                    <span className="px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full text-xs font-bold uppercase tracking-wide">
                                                        {visita.cantidad_personas} Personas
                                                    </span>
                                                    <span className={cn(
                                                        "text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wide",
                                                        BADGE_ESTADO[visita.estado] ?? 'text-outline bg-surface-container border border-outline-variant'
                                                    )}>
                                                        {visita.estado}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Footer del Modal */}
                        <div className="p-4 border-t border-surface-container bg-surface flex justify-end">
                            <Button variant="outline" onClick={cerrarModal}>Cerrar</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL PARA IMPRIMIR LISTADO POR RANGO --- */}
            {modalImprimirAbierto && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
                        
                        {/* Header */}
                        <div className="flex justify-between items-center p-6 border-b border-surface-container bg-white">
                            <div>
                                <h3 className="font-h2 text-h2 text-on-surface">Imprimir Listado</h3>
                                <p className="font-body-md text-on-surface-variant mt-1">Selecciona el rango de fechas para exportar en PDF.</p>
                            </div>
                            <button 
                                onClick={() => { setModalImprimirAbierto(false); setErrorImpresion(null); }} 
                                disabled={generandoPDF}
                                className="p-2 hover:bg-surface-container-low rounded-full text-on-surface-variant transition-colors disabled:opacity-50"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        {/* Cuerpo del Formulario */}
                        <form onSubmit={handleImprimirListado}>
                            <div className="p-6 space-y-4 bg-surface-container-lowest">
                                {errorImpresion && (
                                    <div className="flex items-center gap-2 p-4 bg-error-container/30 border border-error/20 rounded-xl text-error text-sm font-semibold">
                                        <span className="material-symbols-outlined text-[20px]">error</span>
                                        <span>{errorImpresion}</span>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1">
                                        <label htmlFor="fechaDesde" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Fecha Desde</label>
                                        <input
                                            type="date"
                                            id="fechaDesde"
                                            value={fechaDesde}
                                            onChange={(e) => { setFechaDesde(e.target.value); setErrorImpresion(null); }}
                                            required
                                            disabled={generandoPDF}
                                            className="px-4 py-2.5 bg-slate-50 border border-outline-variant rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none transition-shadow disabled:opacity-50"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label htmlFor="fechaHasta" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Fecha Hasta</label>
                                        <input
                                            type="date"
                                            id="fechaHasta"
                                            value={fechaHasta}
                                            onChange={(e) => { setFechaHasta(e.target.value); setErrorImpresion(null); }}
                                            required
                                            disabled={generandoPDF}
                                            className="px-4 py-2.5 bg-slate-50 border border-outline-variant rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none transition-shadow disabled:opacity-50"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-4 border-t border-surface-container bg-surface flex justify-end gap-3">
                                <Button 
                                    variant="outline" 
                                    type="button"
                                    onClick={() => { setModalImprimirAbierto(false); setErrorImpresion(null); }} 
                                    disabled={generandoPDF}
                                >
                                    Cancelar
                                </Button>
                                <Button 
                                    variant="primary" 
                                    type="submit"
                                    disabled={generandoPDF}
                                    className="min-w-[120px] flex items-center justify-center gap-2"
                                >
                                    {generandoPDF ? (
                                        <>
                                            <span className="animate-spin material-symbols-outlined text-[18px]">sync</span>
                                            Generando...
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined text-[18px]">download</span>
                                            Descargar PDF
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};