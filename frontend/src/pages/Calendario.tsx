import { useEffect, useState } from 'react';
import { Button } from '../components/ui/Button';
import { cn } from '../utils/cn';
import { Link } from 'react-router-dom';

export const Calendario = () => {
    const [fechaActual, setFechaActual] = useState(new Date());
    const [datosMes, setDatosMes] = useState<Record<number, any>>({});
    const [loading, setLoading] = useState(false);

    const anio = fechaActual.getFullYear();
    const mes = fechaActual.getMonth();

    const diasEnElMes = new Date(anio, mes + 1, 0).getDate();
    const primerDiaDelMes = new Date(anio, mes, 1).getDay();
    const diaInicio = primerDiaDelMes === 0 ? 6 : primerDiaDelMes - 1;

    const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    useEffect(() => {
        const fetchDatosCalendario = async () => {
            setLoading(true);
            const token = localStorage.getItem('token');
            try {
                // Le mandamos el mes + 1 porque JavaScript cuenta los meses desde el 0
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
    }, [anio, mes]);

    const obtenerEstadoDia = (dia: number) => {
        if (datosMes[dia]) {
            return datosMes[dia];
        }
        return { estado: 'disponible', texto: 'Libre', visitas: 0 };
    };

    const mesAnterior = () => setFechaActual(new Date(anio, mes - 1, 1));
    const mesSiguiente = () => setFechaActual(new Date(anio, mes + 1, 1));
    const mesActualStr = new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' }).format(fechaActual);

    return (
        <div className="flex flex-col max-w-[1440px] w-full mx-auto">
            {/* Cabecera de la pantalla */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-md mb-lg">
                <div>
                    <h1 className="font-h1 text-h1 text-on-surface mb-xs capitalize">Calendario Operativo</h1>
                    <p className="font-body-md text-on-surface-variant">Visualización de ocupación mensual y gestión de fechas.</p>
                </div>
                <div className="flex gap-sm">
                    <Button variant="outline">
                        <span className="material-symbols-outlined text-[18px]">print</span>
                        Imprimir Mes
                    </Button>
                    {/* Asegurate de que la ruta del to="" coincida con la que tenés en App.tsx */}
                    <Link to="/visitas" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary-container transition-all">
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        Agregar Visita
                    </Link>
                </div>
            </div>

            {/* Contenedor Principal del Calendario */}
            <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant overflow-hidden relative">
                {loading && (
                    <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
                        <span className="animate-spin material-symbols-outlined text-4xl text-primary">sync</span>
                    </div>
                )}

                {/* Barra de Navegación del Mes */}
                <div className="flex items-center justify-between p-6 border-b border-surface-container-highest">
                    <h2 className="font-h3 text-h3 capitalize text-on-surface">{mesActualStr}</h2>
                    <div className="flex items-center gap-2">
                        <button onClick={mesAnterior} className="p-2 rounded-lg hover:bg-surface-container-low transition-colors text-on-surface-variant">
                            <span className="material-symbols-outlined">chevron_left</span>
                        </button>
                        <button onClick={() => setFechaActual(new Date())} className="px-4 py-2 font-label-md text-primary hover:bg-primary-container/50 rounded-lg transition-colors">
                            Hoy
                        </button>
                        <button onClick={mesSiguiente} className="p-2 rounded-lg hover:bg-surface-container-low transition-colors text-on-surface-variant">
                            <span className="material-symbols-outlined">chevron_right</span>
                        </button>
                    </div>
                </div>

                {/* Grilla del Calendario */}
                <div className="p-6">
                    <div className="grid grid-cols-7 gap-4 mb-4">
                        {diasSemana.map(dia => (
                            <div key={dia} className="text-center font-label-md text-on-surface-variant uppercase tracking-wider">
                                {dia}
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-4">
                        {/* Celdas vacías para el inicio del mes */}
                        {Array.from({ length: diaInicio }).map((_, i) => (
                            <div key={`empty-${i}`} className="min-h-[120px] rounded-xl border border-dashed border-outline-variant/50 bg-surface-bright/50"></div>
                        ))}

                        {/* Días del mes */}
                        {Array.from({ length: diasEnElMes }).map((_, i) => {
                            const dia = i + 1;
                            const { estado, texto, visitas } = obtenerEstadoDia(dia);
                            const esHoy = new Date().getDate() === dia && new Date().getMonth() === mes && new Date().getFullYear() === anio;

                            return (
                                <div
                                    key={dia}
                                    className={cn(
                                        "min-h-[120px] p-3 rounded-xl border flex flex-col transition-all hover:shadow-md cursor-pointer",
                                        estado === 'inhabilitado' ? "bg-surface-container-low border-surface-container opacity-60" : "bg-white border-outline-variant/50 hover:border-primary/30",
                                        esHoy && "ring-2 ring-primary border-transparent"
                                    )}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={cn(
                                            "w-8 h-8 flex items-center justify-center rounded-full font-label-md",
                                            esHoy ? "bg-primary text-white" : "text-on-surface"
                                        )}>
                                            {dia}
                                        </span>
                                    </div>

                                    {/* Indicadores Visuales */}
                                    <div className="mt-auto flex flex-col gap-1">
                                        {estado !== 'disponible' && estado !== 'inhabilitado' && (
                                            <div className="text-xs font-medium text-on-surface-variant">
                                                {visitas} personas
                                            </div>
                                        )}

                                        <div className={cn(
                                            "text-[11px] px-2 py-1 rounded font-bold uppercase tracking-wider truncate",
                                            estado === 'lleno' && "bg-error-container text-on-error-container",
                                            estado === 'parcial' && "bg-[#e6f4ea] text-[#137333]",
                                            estado === 'inhabilitado' && "bg-surface-variant text-on-surface-variant",
                                            estado === 'disponible' && "bg-surface-container-lowest text-outline border border-dashed border-outline/30" // Diseño sutil para "Libre"
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
        </div>
    );
};