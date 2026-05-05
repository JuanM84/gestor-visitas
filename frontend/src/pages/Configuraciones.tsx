import { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';

export const Configuraciones = () => {
    // --- Estados para Parámetros Generales ---
    const [aforoMaximo, setAforoMaximo] = useState('50');
    const [guardandoAforo, setGuardandoAforo] = useState(false);
    const [mensajeAforo, setMensajeAforo] = useState({ tipo: '', texto: '' });

    // --- Estados para Días Inhábiles ---
    const [dias, setDias] = useState<any[]>([]);
    const [fecha, setFecha] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [loadingDias, setLoadingDias] = useState(false);
    const [errorDias, setErrorDias] = useState<string | null>(null);

    const token = localStorage.getItem('token');
    const inputStyles = "w-full h-11 px-4 rounded-lg border border-outline-variant bg-surface-bright text-on-background focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none transition-all";

    // --- Efecto de carga inicial ---
    useEffect(() => {
        fetchAforo();
        fetchDias();
    }, []);

    // --- Lógica Parámetros Generales ---
    const fetchAforo = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/configuracion/capacidad_maxima', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setAforoMaximo(data.valor);
            }
        } catch (err) {
            console.error("Error al cargar aforo", err);
        }
    };

    const handleGuardarAforo = async (e: React.FormEvent) => {
        e.preventDefault();
        setGuardandoAforo(true);
        setMensajeAforo({ tipo: '', texto: '' });

        try {
            const res = await fetch('http://localhost:3000/api/configuracion/capacidad_maxima', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ valor: aforoMaximo })
            });

            if (!res.ok) throw new Error('Error al actualizar');
            setMensajeAforo({ tipo: 'exito', texto: 'Aforo actualizado correctamente.' });
        } catch (err) {
            setMensajeAforo({ tipo: 'error', texto: 'No se pudo guardar la configuración.' });
        } finally {
            setGuardandoAforo(false);
            // Limpiamos el mensaje de éxito después de 3 segundos
            setTimeout(() => setMensajeAforo({ tipo: '', texto: '' }), 3000);
        }
    };

    // --- Lógica Días Inhábiles ---
    const fetchDias = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/dias-inhabiles', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setDias(data);
            }
        } catch (err) {
            console.error("Error al cargar días", err);
        }
    };

    const handleAgregarDia = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoadingDias(true);
        setErrorDias(null);

        try {
            const res = await fetch('http://localhost:3000/api/dias-inhabiles', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ fecha, descripcion })
            });

            if (!res.ok) throw new Error('Error al guardar el día');

            setFecha('');
            setDescripcion('');
            fetchDias();
        } catch (err: any) {
            setErrorDias(err.message);
        } finally {
            setLoadingDias(false);
        }
    };

    const handleEliminarDia = async (id: string) => {
        if (!confirm('¿Seguro que desea habilitar nuevamente este día?')) return;

        try {
            const res = await fetch(`http://localhost:3000/api/dias-inhabiles/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) fetchDias();
        } catch (err) {
            console.error("Error al eliminar", err);
        }
    };

    return (
        <div className="flex flex-col max-w-[1200px] w-full mx-auto">
            <div className="mb-lg">
                <h1 className="font-h1 text-h1 text-on-surface">Configuraciones del Sistema</h1>
                <p className="font-body-md text-on-surface-variant mt-2">Administre las reglas de negocio, aforos y calendario operativo.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg items-start">

                {/* COLUMNA IZQUIERDA: Parámetros Generales */}
                <div className="lg:col-span-1 flex flex-col gap-lg">
                    <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant">
                        <div className="flex items-center gap-2 mb-4 text-primary">
                            <span className="material-symbols-outlined">tune</span>
                            <h2 className="font-h3 text-h3">Parámetros Operativos</h2>
                        </div>

                        <form onSubmit={handleGuardarAforo} className="flex flex-col gap-4">
                            <div>
                                <label className="font-label-sm block mb-1">Aforo Máximo Diario</label>
                                <p className="text-xs text-on-surface-variant mb-2">Cantidad límite de personas que pueden visitar el túnel en un mismo día.</p>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="1"
                                        required
                                        value={aforoMaximo}
                                        onChange={(e) => setAforoMaximo(e.target.value)}
                                        className={inputStyles}
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant">personas</span>
                                </div>
                            </div>

                            {mensajeAforo.texto && (
                                <div className={`p-3 rounded-lg text-sm font-medium ${mensajeAforo.tipo === 'exito' ? 'bg-[#e6f4ea] text-[#137333]' : 'bg-error-container text-on-error-container'}`}>
                                    {mensajeAforo.texto}
                                </div>
                            )}

                            <Button variant="primary" type="submit" disabled={guardandoAforo} className="w-full mt-2">
                                {guardandoAforo ? 'Guardando...' : 'Actualizar Aforo'}
                            </Button>
                        </form>
                    </div>
                </div>

                {/* COLUMNA DERECHA: Días Inhábiles */}
                <div className="lg:col-span-2 bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <div className="flex items-center gap-2 text-primary">
                            <span className="material-symbols-outlined">event_busy</span>
                            <h2 className="font-h3 text-h3">Bloqueo de Calendario</h2>
                        </div>
                    </div>

                    {/* Formulario rápido para agregar día */}
                    <form onSubmit={handleAgregarDia} className="flex flex-wrap gap-4 items-end mb-6 p-4 bg-surface-bright rounded-xl border border-surface-container-highest">
                        <div className="flex-1 min-w-[200px]">
                            <label className="font-label-sm block mb-1 text-on-surface-variant">Fecha a bloquear</label>
                            <input type="date" required value={fecha} onChange={(e) => setFecha(e.target.value)} className={inputStyles} />
                        </div>
                        <div className="flex-[2] min-w-[250px]">
                            <label className="font-label-sm block mb-1 text-on-surface-variant">Motivo / Descripción</label>
                            <input type="text" required placeholder="Ej: Mantenimiento anual" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className={inputStyles} />
                        </div>
                        <Button variant="outline" type="submit" disabled={loadingDias} className="h-11">
                            <span className="material-symbols-outlined text-[18px]">add</span>
                            Agregar Día
                        </Button>
                        {errorDias && <p className="text-error text-sm w-full mt-1">{errorDias}</p>}
                    </form>

                    {/* Tabla de Días Inhábiles */}
                    <div className="rounded-xl border border-surface-container-highest overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-surface-container-low border-b border-surface-container-highest">
                                <tr>
                                    <th className="p-4 font-label-md">Fecha Bloqueada</th>
                                    <th className="p-4 font-label-md">Motivo del Bloqueo</th>
                                    <th className="p-4 font-label-md text-right">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-surface-container-highest">
                                {dias.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="p-8 text-center text-on-surface-variant">No hay días inhábiles configurados. El calendario está totalmente abierto.</td>
                                    </tr>
                                ) : (
                                    dias.map((dia) => (
                                        <tr key={dia.id} className="hover:bg-surface-bright transition-colors">
                                            <td className="p-4 font-medium text-error">
                                                {new Date(dia.fecha).toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                            </td>
                                            <td className="p-4 text-on-surface-variant">{dia.descripcion}</td>
                                            <td className="p-4 text-right">
                                                <button
                                                    onClick={() => handleEliminarDia(dia.id)}
                                                    className="text-outline hover:text-error hover:bg-error-container p-2 rounded-lg transition-colors"
                                                    title="Eliminar bloqueo"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">delete</span>
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
        </div>
    );
};