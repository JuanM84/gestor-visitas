import { useState, useEffect } from 'react';
import { cn } from '../utils/cn';
import { useAuth } from '../context/AuthContext';

interface LogAuditoria {
    id: number;
    fecha: string;
    usuario_email: string;
    usuario_rol: string;
    accion: string;
}

export const Auditoria = () => {
    const [logs, setLogs] = useState<LogAuditoria[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filtros
    const [filtroFecha, setFiltroFecha] = useState('');
    const [filtroEmail, setFiltroEmail] = useState('');
    const [filtroAccion, setFiltroAccion] = useState('');

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
    }, [token]);

    const formatFecha = (fechaStr: string) => {
        const d = new Date(fechaStr);
        return `${d.toLocaleDateString('es-AR')} - ${d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs`;
    };

    const getLocalDateString = (fechaStr: string) => {
        const d = new Date(fechaStr);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const logsFiltrados = logs.filter(log => {
        if (filtroFecha) {
            const logLocalDate = getLocalDateString(log.fecha);
            if (logLocalDate !== filtroFecha) {
                return false;
            }
        }
        if (filtroEmail) {
            const email = (log.usuario_email || 'sistema').toLowerCase();
            if (!email.includes(filtroEmail.toLowerCase())) {
                return false;
            }
        }
        if (filtroAccion) {
            const accion = log.accion.toLowerCase();
            if (!accion.includes(filtroAccion.toLowerCase())) {
                return false;
            }
        }
        return true;
    });

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

            {/* Barra de Filtros */}
            <div className="bg-white rounded-3xl p-6 border border-outline-variant shadow-sm mb-6">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label className="block text-xs font-bold uppercase text-outline mb-1.5">Fecha</label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px] pointer-events-none">calendar_month</span>
                            <input
                                type="date"
                                className="w-full h-11 pl-10 pr-8 rounded-xl border border-outline-variant bg-surface-bright text-on-background text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                value={filtroFecha}
                                onChange={(e) => setFiltroFecha(e.target.value)}
                            />
                            {filtroFecha && (
                                <button
                                    onClick={() => setFiltroFecha('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-background transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[18px]">close</span>
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 w-full">
                        <label className="block text-xs font-bold uppercase text-outline mb-1.5">Email de Usuario</label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px] pointer-events-none">mail</span>
                            <input
                                type="text"
                                placeholder="Buscar por email..."
                                className="w-full h-11 pl-10 pr-8 rounded-xl border border-outline-variant bg-surface-bright text-on-background text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                value={filtroEmail}
                                onChange={(e) => setFiltroEmail(e.target.value)}
                            />
                            {filtroEmail && (
                                <button
                                    onClick={() => setFiltroEmail('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-background transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[18px]">close</span>
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex-[2] w-full">
                        <label className="block text-xs font-bold uppercase text-outline mb-1.5">Acción Realizada</label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px] pointer-events-none">search</span>
                            <input
                                type="text"
                                placeholder="Buscar por palabra clave..."
                                className="w-full h-11 pl-10 pr-8 rounded-xl border border-outline-variant bg-surface-bright text-on-background text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                value={filtroAccion}
                                onChange={(e) => setFiltroAccion(e.target.value)}
                            />
                            {filtroAccion && (
                                <button
                                    onClick={() => setFiltroAccion('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-background transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[18px]">close</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {(filtroFecha || filtroEmail || filtroAccion) && (
                        <button
                            onClick={() => {
                                setFiltroFecha('');
                                setFiltroEmail('');
                                setFiltroAccion('');
                            }}
                            className="h-11 px-4 text-sm font-bold text-error border border-error-container rounded-xl hover:bg-error-container/20 transition-all flex items-center justify-center gap-1 shrink-0 w-full md:w-auto"
                        >
                            <span className="material-symbols-outlined text-[18px]">filter_alt_off</span>
                            Limpiar
                        </button>
                    )}
                </div>
            </div>

            {/* Contenedor de la Tabla */}
            <div className="bg-white rounded-3xl border border-outline-variant shadow-sm overflow-hidden">
                <div className="p-6 border-b border-surface-container flex justify-between items-center bg-surface-container-lowest">
                    <h3 className="font-h3 text-on-surface">Historial de Acciones</h3>
                    <span className="text-xs font-bold uppercase text-outline tracking-wider">
                        {logsFiltrados.length === logs.length 
                            ? `Últimos ${logs.length} registros` 
                            : `Mostrando ${logsFiltrados.length} de ${logs.length} registros`}
                    </span>
                </div>

                {loading ? (
                    <div className="p-10 text-center text-on-surface-variant animate-pulse">Cargando registros...</div>
                ) : error ? (
                    <div className="p-10 text-center text-error font-bold">{error}</div>
                ) : logs.length === 0 ? (
                    <div className="p-10 text-center text-outline">No hay registros de auditoría disponibles.</div>
                ) : logsFiltrados.length === 0 ? (
                    <div className="p-10 text-center text-on-surface-variant">No se encontraron registros de auditoría que coincidan con los filtros.</div>
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
                                {logsFiltrados.map((log) => (
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