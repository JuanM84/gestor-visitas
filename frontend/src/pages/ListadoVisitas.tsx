import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import * as XLSX from 'xlsx';
import { cn } from '../utils/cn';

export const ListadoVisitas = () => {
    const navigate = useNavigate();

    const [busqueda, setBusqueda] = useState('');
    const [visitas, setVisitas] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchHistorial = async () => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch('http://localhost:3000/api/visitas/historial', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('No se pudo cargar el historial');

            const data = await response.json();
            setVisitas(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistorial();
    }, []);

    const handleCancelar = async (id: string) => {

        const motivo = window.prompt('¿Está seguro de cancelar esta visita? Ingrese un motivo (opcional):');

        if (motivo === null) return;

        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`http://localhost:3000/api/visitas/${id}/cancelar`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ motivo })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Error al cancelar la visita');
            }
            fetchHistorial();
        } catch (err: any) {
            alert(`No se pudo cancelar: ${err.message}`);
        }
    };
    const handleExportarExcel = () => {
        // 1. Damos formato a los datos para que el Excel sea fácil de leer
        const datosParaExcel = visitas.map((v: any) => ({
            'Fecha': new Date(v.fecha).toLocaleDateString('es-AR'),
            'Hora': v.hora_inicio.slice(0, 5),
            'Tipo de Visita': v.tipo,
            'Institución / Gestor': v.gestor_nombre,
            'Nombre del Grupo': v.grupo_nombre,
            'Nivel Educativo': v.nivel_educativo || 'N/A',
            'Cant. Personas': v.cantidad_personas,
            'Estado': v.estado,
            'Registrado Por': v.usuario_registro
        }));

        // 2. Creamos una hoja de cálculo (worksheet)
        const worksheet = XLSX.utils.json_to_sheet(datosParaExcel);

        // 3. Creamos un libro de cálculo (workbook) y le añadimos la hoja
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Historial_Visitas");

        // 4. Forzamos la descarga del archivo con la fecha de hoy en el nombre
        const fechaHoy = new Date().toISOString().split('T')[0];
        XLSX.writeFile(workbook, `Reporte_Visitas_Tunel_${fechaHoy}.xlsx`);
    };

    const inputStyles = "w-full pl-10 pr-4 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-secondary focus:ring-1 focus:ring-secondary outline-none font-body-sm text-on-surface transition-all";

    return (
        <div className="flex flex-col max-w-[1440px] w-full mx-auto">
            {/* Cabecera */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-md mb-lg">
                <div>
                    <h1 className="font-h1 text-h1 text-on-surface mb-xs">Visitantes e Instituciones</h1>
                    <p className="font-body-md text-on-surface-variant">Gestione el historial y controle el acceso de las delegaciones.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleExportarExcel}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-outline-variant bg-surface text-on-surface font-medium hover:bg-surface-container-low transition-all"
                    >
                        <span className="material-symbols-outlined text-[18px] text-[#107c41]">table_view</span>
                        Exportar Excel
                    </button>

                    <button onClick={() => navigate('/nueva-visita')} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary-container transition-all">
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        Nueva Visita
                    </button>
                </div>
            </div>

            {/* Barra de Filtros */}
            <div className="bg-surface-container-lowest p-md rounded-lg shadow-sm border border-outline-variant mb-md flex flex-wrap gap-md items-end">
                <div className="flex-1 min-w-[280px]">
                    <label className="block font-label-sm text-on-surface-variant mb-xs">Buscar Registro</label>
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">search</span>
                        <input
                            type="text"
                            className={inputStyles}
                            placeholder="Buscar por institución..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                        />
                    </div>
                </div>
                <div className="w-full sm:w-auto min-w-[180px]">
                    <label className="block font-label-sm text-on-surface-variant mb-xs">Fecha</label>
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">calendar_month</span>
                        <input type="date" className={inputStyles} />
                    </div>
                </div>
                <div className="w-full sm:w-auto min-w-[180px]">
                    <label className="block font-label-sm text-on-surface-variant mb-xs">Estado</label>
                    <div className="relative">
                        <select className={cn(inputStyles, "appearance-none cursor-pointer")}>
                            <option value="">Todos los estados</option>
                            <option value="Confirmada">Confirmada</option>
                            <option value="Pendiente">Pendiente</option>
                            <option value="Realizada">Realizada</option>
                        </select>
                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-[20px]">expand_more</span>
                    </div>
                </div>
            </div>

            {/* Tabla de Datos */}
            <div className="bg-surface-container-lowest rounded-lg shadow-sm border border-surface-container-highest overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-surface-container-low border-b border-surface-container-highest">
                            <tr>
                                <th className="p-4 font-label-md text-on-surface whitespace-nowrap">Gestor / Institución</th>
                                <th className="p-4 font-label-md text-on-surface whitespace-nowrap">Fecha y Hora</th>
                                <th className="p-4 font-label-md text-on-surface whitespace-nowrap text-center">Personas</th>
                                <th className="p-4 font-label-md text-on-surface whitespace-nowrap">Estado</th>
                                <th className="p-4 font-label-md text-on-surface whitespace-nowrap text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="font-body-sm text-on-surface divide-y divide-surface-container-highest">
                            {visitas.map((v) => (
                                <tr key={v.id} className="hover:bg-surface-bright transition-colors even:bg-surface-container-lowest odd:bg-surface-bright">
                                    <td className="p-4">
                                        <div className="font-label-md text-on-surface mb-0.5">{v.gestor_nombre}</div>
                                        <div className="text-on-surface-variant text-xs">{v.tipo}</div>
                                    </td>
                                    <td className="p-4">
                                        <div>{v.fecha}</div>
                                        <div className="text-on-surface-variant text-xs">{v.hora_inicio} hs</div>
                                    </td>
                                    <td className="p-4 text-center font-medium">
                                        {v.cantidad_personas}
                                    </td>
                                    <td className="p-4">
                                        <span className={cn(
                                            "inline-flex items-center px-2 py-0.5 rounded font-label-sm",
                                            v.estado === 'Confirmada' ? "bg-primary-container text-on-primary-container" :
                                                v.estado === 'Realizada' ? "bg-[#e6f4ea] text-[#137333]" :
                                                    v.estado === 'Cancelada' ? "bg-error-container text-on-error-container" :
                                                        "bg-surface-variant text-on-surface-variant border border-outline-variant/30"
                                        )}>
                                            {v.estado}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => navigate(`/visitas/${v.id}`)}
                                            className="p-1.5 text-outline hover:text-primary transition-colors rounded hover:bg-surface-container-low"
                                            title="Ver Detalles"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">visibility</span>
                                        </button>
                                        <button
                                            onClick={() => navigate(`/visitas/editar/${v.id}`)}
                                            className="p-1.5 text-outline hover:text-primary transition-colors rounded hover:bg-surface-container-low"
                                            title="Editar"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">edit</span>
                                        </button>
                                        {v.estado !== 'Cancelada' && (
                                            <button
                                                onClick={() => handleCancelar(v.id)}
                                                className="p-1.5 text-outline hover:text-error transition-colors rounded hover:bg-error-container"
                                                title="Cancelar Visita"
                                            >
                                                <span className="material-symbols-outlined text-[20px]">cancel</span>
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Paginación simple */}
                <div className="p-4 border-t border-surface-container-highest bg-surface-container-lowest flex items-center justify-between">
                    <div className="text-sm text-on-surface-variant font-body-sm">
                        Mostrando <span className="font-medium text-on-surface">{visitas.length}</span> registros
                    </div>
                </div>
            </div>
        </div>
    );
};