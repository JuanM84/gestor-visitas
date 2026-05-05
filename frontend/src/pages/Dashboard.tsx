import { useEffect, useState } from 'react';
import { StatCard } from '../components/dashboard/StatCard';
import { cn } from '../utils/cn';
import { Link, useNavigate } from 'react-router-dom';

export const Dashboard = () => {
    const navigate = useNavigate();
    const [visitas, setVisitas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fechaFiltro, setFechaFiltro] = useState(new Date().toISOString().split('T')[0]);

    const [aforoMaximo, setAforoMaximo] = useState(50);

    const token = localStorage.getItem('token');

    const fetchVisitas = async () => {
        try {
            setLoading(true);
            const response = await fetch(`http://localhost:3000/api/visitas?fecha=${fechaFiltro}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            const visitasData = Array.isArray(result) ? result : (result.data || []);
            setVisitas(visitasData);
        } catch (error) {
            console.error("Error cargando visitas:", error);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        const fetchAforo = async () => {
            try {
                const res = await fetch('http://localhost:3000/api/configuracion/capacidad_maxima', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setAforoMaximo(parseInt(data.valor, 10)); // Convertimos el texto a número
                }
            } catch (error) {
                console.error("Error cargando aforo máximo:", error);
            }
        };
        fetchAforo();
    }, []);

    useEffect(() => {
        fetchVisitas();
    }, [fechaFiltro]);

    const handleCancelar = async (id: string) => {
        const motivo = window.prompt('¿Está seguro de cancelar esta visita? Ingrese un motivo (opcional):');
        if (motivo === null) return;

        try {
            const response = await fetch(`http://localhost:3000/api/visitas/${id}/cancelar`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ motivo })
            });

            if (!response.ok) throw new Error('Error al cancelar la visita');

            fetchVisitas();
        } catch (err: any) {
            alert(`No se pudo cancelar: ${err.message}`);
        }
    };

    const visitasActivas = visitas.filter((v: any) => v.estado !== 'Cancelada');

    const visitantesTotales = visitasActivas.reduce((total, v: any) => {
        return total + parseInt(v.cantidad_personas || 0, 10);
    }, 0);

    const cuposDisponibles = Math.max(0, aforoMaximo - visitantesTotales);

    return (
        <div className="flex flex-col gap-lg">
            {/* Header del Dashboard */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="font-h2 text-h2 mb-xs">Visitas del Día</h1>
                    <p className="text-on-surface-variant">Gestión de delegaciones y horarios operativos.</p>
                </div>
                <Link to="/nueva-visita" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary-container transition-all">
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    Nueva Visita
                </Link>
            </div>

            {/* KPIs Principales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
                <StatCard
                    label="Visitas en la Fecha"
                    value={visitasActivas.length}
                    icon="calendar_today"
                />
                <StatCard
                    label="Visitantes Totales"
                    value={visitantesTotales}
                    icon="group"
                />
                <StatCard
                    label="Cupos Disponibles"
                    value={cuposDisponibles}
                    icon="pending_actions"
                    variant={cuposDisponibles === 0 ? "error" : "primary"}
                />
            </div>

            {/* Tabla de Visitas */}
            <div className="bg-surface-container-lowest rounded-xl shadow-[0_4px_20px_rgba(0,52,111,0.04)] border border-surface-container overflow-hidden">
                <div className="p-6 border-b border-surface-container bg-white flex justify-between items-center">
                    <h2 className="font-h3 text-h3">Cronograma Diario</h2>
                    <input
                        type="date"
                        className="border border-outline-variant rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary"
                        value={fechaFiltro}
                        onChange={(e) => setFechaFiltro(e.target.value)}
                    />
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-surface text-outline font-label-md uppercase tracking-wider border-b border-surface-container">
                                <th className="p-4 pl-6">Hora</th>
                                <th className="p-4">Tipo</th>
                                <th className="p-4">Grupo / Gestor</th>
                                <th className="p-4 text-center">Personas</th>
                                <th className="p-4">Estado</th>
                                <th className="p-4 pr-6 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-container">
                            {loading ? (
                                <tr><td colSpan={6} className="p-8 text-center text-outline">Cargando cronograma...</td></tr>
                            ) : visitasActivas.length === 0 ? (
                                <tr><td colSpan={6} className="p-8 text-center text-outline">No hay visitas activas agendadas para esta fecha.</td></tr>
                            ) : (
                                visitasActivas.map((v: any) => (
                                    <tr key={v.id} className="hover:bg-surface-container-low transition-colors group">
                                        <td className="p-4 pl-6 font-bold">{v.hora_inicio.slice(0, 5)}</td>
                                        <td className="p-4 text-on-surface-variant text-sm">{v.tipo}</td>
                                        <td className="p-4">
                                            <div className="font-semibold text-sm">{v.grupo_nombre}</div>
                                            <div className="text-xs text-outline">{v.gestor_nombre}</div>
                                        </td>
                                        <td className="p-4 text-center font-medium">{v.cantidad_personas}</td>
                                        <td className="p-4">
                                            <span className={cn(
                                                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                                                v.estado === 'Realizada' ? "bg-[#e6f4ea] text-[#137333]" :
                                                    "bg-[#fff8e1] text-[#b08d00]"
                                            )}>
                                                {v.estado}
                                            </span>
                                        </td>
                                        {/* 5. BOTONERA: Ver, Editar y Cancelar */}
                                        <td className="p-4 pr-6 text-right flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                                            <button
                                                onClick={() => handleCancelar(v.id)}
                                                className="p-1.5 text-outline hover:text-error transition-colors rounded hover:bg-error-container"
                                                title="Cancelar Visita"
                                            >
                                                <span className="material-symbols-outlined text-[20px]">cancel</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};