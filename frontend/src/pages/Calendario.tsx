import { useEffect, useState } from 'react';
import { Button } from '../components/ui/Button';
import { cn } from '../utils/cn';
import { Link } from 'react-router-dom';

export const Calendario = () => {
    const [fechaActual, setFechaActual] = useState(new Date());
    const [datosMes, setDatosMes] = useState<Record<number, any>>({});
    const [loading, setLoading] = useState(false);

    // --- NUEVOS ESTADOS PARA EL MODAL ---
    const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null);
    const [visitasDelDia, setVisitasDelDia] = useState<any[]>([]);
    const [loadingVisitas, setLoadingVisitas] = useState(false);

    const token = localStorage.getItem('token');
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
                const response = await fetch(`http://localhost:3000/api/visitas/calendario?anio=${anio}&mes=${mes + 1}`, {
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

    // --- NUEVA FUNCIÓN: AL HACER CLIC EN UN DÍA ---
    const handleDiaClick = async (dia: number) => {
        const estadoDia = obtenerEstadoDia(dia);

        // Si está inhabilitado o no hay visitas, no hacemos la petición (opcional, pero ahorra recursos)
        if (estadoDia.estado === 'inhabilitado' || estadoDia.estado === 'disponible') {
            return;
        }

        // Formateamos la fecha a YYYY-MM-DD para el backend
        const fechaStr = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
        setDiaSeleccionado(fechaStr);
        setLoadingVisitas(true);

        try {
            // Usamos la ruta del Dashboard que ya teníamos creada
            const response = await fetch(`http://localhost:3000/api/visitas?fecha=${fechaStr}`, {
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

    return (
        <div className="flex flex-col max-w-[1440px] w-full mx-auto relative">
            {/* Cabecera */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-md mb-lg">
                <div>
                    <h1 className="font-h1 text-h1 text-on-surface mb-xs capitalize">Calendario Operativo</h1>
                    <p className="font-body-md text-on-surface-variant">Visualización de ocupación mensual y gestión de fechas.</p>
                </div>
                <div className="flex gap-sm">
                    <Button variant="outline">
                        <span className="material-symbols-outlined text-[18px]">print</span> Imprimir Mes
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
                            const isClickable = estado === 'parcial' || estado === 'lleno';

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
                                        {estado !== 'disponible' && estado !== 'inhabilitado' && (
                                            <div className="text-xs font-medium text-on-surface-variant">{visitas} personas</div>
                                        )}
                                        <div className={cn(
                                            "text-[11px] px-2 py-1 rounded font-bold uppercase tracking-wider truncate",
                                            estado === 'lleno' && "bg-error-container text-on-error-container",
                                            estado === 'parcial' && "bg-[#e6f4ea] text-[#137333]",
                                            estado === 'inhabilitado' && "bg-surface-variant text-on-surface-variant",
                                            estado === 'disponible' && "bg-surface-container-lowest text-outline border border-dashed border-outline/30"
                                        )}>
                                            {texto}
                                        </div>
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
                                <div className="text-center text-outline py-8">Cargando reservas...</div>
                            ) : visitasDelDia.length === 0 ? (
                                <div className="text-center text-outline py-8">No hay reservas para este día.</div>
                            ) : (
                                <div className="flex flex-col gap-4">
                                    {visitasDelDia.map((visita: any) => (
                                        <div key={visita.id} className="p-4 border border-outline-variant rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white hover:border-primary/30 transition-colors">
                                            <div className="flex gap-4 items-center">
                                                <div className="w-12 h-12 rounded-full bg-sky-100 text-sky-800 flex items-center justify-center font-bold text-md border border-sky-200">
                                                    {visita.hora_inicio.slice(0, 5)}
                                                </div>

                                                <div>
                                                    <h4 className="font-bold text-on-surface text-lg">{visita.grupo_nombre}</h4>
                                                    <p className="text-sm text-on-surface-variant flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-[16px]">domain</span>
                                                        {visita.gestor_nombre}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 sm:gap-1">

                                                {/* --- CAMBIO 2: Texto "Personas" en lugar de "PAX" --- */}
                                                <span className="px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full text-xs font-bold uppercase tracking-wide">
                                                    {visita.cantidad_personas} Personas
                                                </span>

                                                <span className={cn(
                                                    "text-xs font-medium px-2 py-0.5 rounded",
                                                    visita.estado === 'Agendada' ? "text-[#137333] bg-[#e6f4ea]" : "text-outline bg-surface-container"
                                                )}>
                                                    {visita.estado}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
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

        </div>
    );
};