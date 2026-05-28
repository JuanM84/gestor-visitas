import { useState, useEffect } from 'react';
import { cn } from '../utils/cn';
import { useAuth } from '../context/AuthContext';

export const Auditoria = () => {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { token } = useAuth();

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auditoria?limite=200`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!response.ok) {
                    if (response.status === 403) throw new Error("Acceso denegado. Se requiere rol de Administrador.");
                    throw new Error("Error al cargar los registros de auditoría.");
                }

                const data = await response.json();
                setLogs(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, []);

    const formatFecha = (fechaStr: string) => {
        const d = new Date(fechaStr);
        return `${d.toLocaleDateString('es-AR')} - ${d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs`;
    };

    return (
        <div className="flex flex-col max-w-[1200px] w-full mx-auto pb-12">

            {/* Cabecera */}
            <div className="mb-8">
                <h1 className="font-h1 text-h1 text-on-surface flex items-center gap-3">
                    <span className="material-symbols-outlined text-3xl text-primary">policy</span>
                    Logs de Auditoría
                </h1>
                <p className="font-body-md text-on-surface-variant mt-2">
                    Registro inmutable de actividades y cambios realizados en el sistema.
                </p>
            </div>

            {/* Contenedor de la Tabla */}
            <div className="bg-white rounded-3xl border border-outline-variant shadow-sm overflow-hidden">
                <div className="p-6 border-b border-surface-container flex justify-between items-center bg-surface-container-lowest">
                    <h3 className="font-h3 text-on-surface">Historial de Acciones</h3>
                    <span className="text-xs font-bold uppercase text-outline tracking-wider">Últimos {logs.length} registros</span>
                </div>

                {loading ? (
                    <div className="p-10 text-center text-on-surface-variant animate-pulse">Cargando registros...</div>
                ) : error ? (
                    <div className="p-10 text-center text-error font-bold">{error}</div>
                ) : logs.length === 0 ? (
                    <div className="p-10 text-center text-outline">No hay registros de auditoría disponibles.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-surface-container-lowest border-b border-outline-variant/50">
                                    <th className="p-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider w-[200px]">Fecha y Hora</th>
                                    <th className="p-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider w-[250px]">Usuario</th>
                                    <th className="p-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Acción Realizada</th>
                                    <th className="p-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider w-[100px]">ID</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-surface-container text-sm">
                                {logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-surface-container-low/50 transition-colors">
                                        <td className="p-4 text-on-surface font-medium whitespace-nowrap">
                                            {formatFecha(log.fecha)}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-on-surface">{log.usuario_email || 'Sistema'}</span>
                                                <span className={cn(
                                                    "text-[10px] uppercase font-bold tracking-widest mt-0.5",
                                                    log.usuario_rol === 'Admin' ? "text-primary" : "text-secondary"
                                                )}>
                                                    {log.usuario_rol || 'Automático'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-on-surface-variant">
                                            {log.accion}
                                        </td>
                                        <td className="p-4 text-outline font-mono text-xs">
                                            #{log.id}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};