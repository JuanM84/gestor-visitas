import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { cn } from '../utils/cn';

export const RegistroVisita = () => {
    const navigate = useNavigate();
    const usuarioLogueado = JSON.parse(localStorage.getItem('usuario') || '{}');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [gestoresDB, setGestoresDB] = useState<any[]>([]);

    const [esNuevoGestor, setEsNuevoGestor] = useState(false);
    const [busquedaGestor, setBusquedaGestor] = useState('');
    const [mostrarDropdown, setMostrarDropdown] = useState(false);
    const [gestorSeleccionado, setGestorSeleccionado] = useState<any>(null);

    // Estado unificado para enviar al backend
    const [formData, setFormData] = useState({
        gestor: { nombre: '', tipo: 'Empresa', telefono: '', email: '' },
        grupo: { nombre: '', tipo: 'Educativo', nivel_educativo: 'Secundario', descripcion: '' },
        visita: { fecha: '', hora_inicio: '', tipo: 'Complejo', tiene_cruce_tunel: false, cantidad_personas: 25 }
    });

    const token = localStorage.getItem('token');

    useEffect(() => {
        const fetchGestores = async () => {
            try {
                const response = await fetch('http://localhost:3000/api/gestores', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    setGestoresDB(data); // Guardamos los datos de PostgreSQL en React
                }
            } catch (err) {
                console.error("Error cargando la lista de gestores:", err);
            }
        };

        fetchGestores();
    }, []);

    const gestoresFiltrados = gestoresDB.filter(g =>
        g.nombre.toLowerCase().includes(busquedaGestor.toLowerCase())
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const payload = {
            usuario_registro_id: usuarioLogueado.id,
            es_nuevo_gestor: esNuevoGestor,
            gestor_id: gestorSeleccionado?.id || null,
            gestor: esNuevoGestor ? { ...formData.gestor, nombre: busquedaGestor } : null,
            grupo: formData.grupo,
            visita: formData.visita
        };

        try {
            const response = await fetch('http://localhost:3000/api/visitas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Error al registrar la visita');
            }

            alert('¡Visita registrada con éxito!');
            navigate('/dashboard');

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const seleccionarGestor = (gestor: any) => {
        setGestorSeleccionado(gestor);
        setBusquedaGestor(gestor.nombre);
        setMostrarDropdown(false);
        setEsNuevoGestor(false);
    };

    const activarNuevoGestor = () => {
        setEsNuevoGestor(true);
        setGestorSeleccionado(null);
        setMostrarDropdown(false);
    };

    const inputStyles = "w-full h-11 px-4 rounded-lg border border-outline-variant bg-surface-bright text-on-background focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all outline-none";
    const labelStyles = "font-label-md text-on-surface mb-2 block";

    return (
        <div className="flex flex-col max-w-[1200px] mx-auto w-full">
            <div className="mb-lg">
                <h1 className="font-h2 text-h2 text-on-background">Registrar Nueva Visita</h1>
                <p className="font-body-md text-on-surface-variant mt-2">Complete los detalles institucionales para asegurar el turno de la delegación.</p>
            </div>

            {error && (
                <div className="p-4 mb-4 bg-error-container/20 border border-error rounded-lg flex items-center gap-3 text-error">
                    <span className="material-symbols-outlined">error</span>
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}

            <div className="flex flex-col lg:flex-row gap-lg items-start">
                {/* Sidebar Izquierdo: Indicador de Progreso */}
                <div className="w-full lg:w-[280px] shrink-0 sticky top-[100px]">
                    <div className="bg-surface-container-lowest rounded-xl p-md border border-outline-variant/50 shadow-sm">
                        <h3 className="font-label-md uppercase tracking-wider mb-6">Pasos del Registro</h3>
                        <div className="relative">
                            <div className="absolute left-[11px] top-2 bottom-6 w-[2px] bg-surface-variant"></div>
                            <ul className="flex flex-col gap-6 relative z-10">
                                <li className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center border-4 border-white shadow-sm mt-0.5">
                                        <div className="w-2 h-2 rounded-full bg-white"></div>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-label-md text-on-background">Completar Datos</span>
                                        <span className="text-sm text-primary">En progreso</span>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Área Principal: Formulario */}
                <div className="flex-1 w-full bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-sm overflow-hidden">
                    <form className="p-lg flex flex-col gap-lg" onSubmit={handleSubmit}>

                        {/* Sección: Gestor Responsable */}
                        <section>
                            <div className="flex items-center gap-2 mb-md border-b border-surface-variant pb-2">
                                <span className="material-symbols-outlined text-secondary text-[20px]">domain</span>
                                <h2 className="font-h3 text-h3 text-on-background">Gestor Responsable</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
                                <div className="flex flex-col md:col-span-2 relative">
                                    <label className={labelStyles}>Buscar o Crear Gestor <span className="text-error">*</span></label>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">search</span>
                                        <input
                                            type="text"
                                            className={cn(inputStyles, "pl-10")}
                                            placeholder="Escriba el nombre..."
                                            value={busquedaGestor}
                                            onChange={(e) => {
                                                setBusquedaGestor(e.target.value);
                                                setMostrarDropdown(true);
                                                setGestorSeleccionado(null);
                                            }}
                                            onFocus={() => setMostrarDropdown(true)}
                                            onBlur={() => setTimeout(() => setMostrarDropdown(false), 200)}
                                            required={!gestorSeleccionado && !esNuevoGestor}
                                        />
                                    </div>
                                    {mostrarDropdown && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-surface-container-lowest border border-outline-variant rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                                            <ul className="py-2">
                                                {gestoresFiltrados.length > 0 ? (
                                                    gestoresFiltrados.map(g => (
                                                        <li key={g.id} className="px-4 py-2 hover:bg-surface-container-low cursor-pointer flex justify-between items-center" onClick={() => seleccionarGestor(g)}>
                                                            <span className="font-medium text-on-surface">{g.nombre}</span>
                                                            <span className="text-xs text-outline bg-surface-variant px-2 py-1 rounded">{g.tipo}</span>
                                                        </li>
                                                    ))
                                                ) : (
                                                    <li className="px-4 py-3 text-sm text-on-surface-variant text-center">Sin coincidencias</li>
                                                )}
                                                <li className="border-t border-surface-variant mt-1">
                                                    <button type="button" className="w-full text-left px-4 py-3 text-primary hover:bg-primary-fixed transition-colors flex items-center gap-2 font-semibold" onClick={activarNuevoGestor}>
                                                        <span className="material-symbols-outlined text-[18px]">add_circle</span> Crear nuevo gestor
                                                    </button>
                                                </li>
                                            </ul>
                                        </div>
                                    )}
                                </div>

                                {esNuevoGestor && (
                                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-gutter p-6 bg-surface rounded-lg border border-outline-variant/50 mt-2">
                                        <div className="md:col-span-2 flex justify-between items-center mb-2">
                                            <p className="font-label-md text-primary m-0">Datos del Nuevo Gestor</p>
                                            <button type="button" onClick={() => setEsNuevoGestor(false)} className="text-error hover:text-on-error-container text-sm flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[16px]">close</span> Cancelar
                                            </button>
                                        </div>
                                        <div>
                                            <label className={labelStyles}>Tipo <span className="text-error">*</span></label>
                                            <select
                                                className={inputStyles}
                                                value={formData.gestor.tipo}
                                                onChange={(e) => setFormData({ ...formData, gestor: { ...formData.gestor, tipo: e.target.value } })}
                                            >
                                                <option value="Empresa">Empresa de Turismo</option>
                                                <option value="Educativa">Entidad Educativa</option>
                                                <option value="Particular">Particular</option>
                                                <option value="Club/Entidad">Club/Entidad</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className={labelStyles}>Teléfono</label>
                                            <input type="text" className={inputStyles} value={formData.gestor.telefono} onChange={(e) => setFormData({ ...formData, gestor: { ...formData.gestor, telefono: e.target.value } })} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Sección: Información del Grupo */}
                        <section>
                            <div className="flex items-center gap-2 mb-md border-b border-surface-variant pb-2">
                                <span className="material-symbols-outlined text-secondary text-[20px]">groups</span>
                                <h2 className="font-h3 text-h3 text-on-background">Información del Grupo</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
                                <div className="flex flex-col md:col-span-2">
                                    <label className={labelStyles}>Nombre del Grupo <span className="text-error">*</span></label>
                                    <input
                                        type="text"
                                        className={inputStyles}
                                        required
                                        value={formData.grupo.nombre}
                                        onChange={(e) => setFormData({ ...formData, grupo: { ...formData.grupo, nombre: e.target.value } })}
                                    />
                                </div>

                                <div className="flex flex-col">
                                    <label className={labelStyles}>Tipo de Grupo <span className="text-error">*</span></label>
                                    <select
                                        className={inputStyles}
                                        value={formData.grupo.tipo}
                                        onChange={(e) => setFormData({ ...formData, grupo: { ...formData.grupo, tipo: e.target.value } })}
                                    >
                                        <option value="Particular">Particular</option>
                                        <option value="Club">Club/Entidad</option>
                                        <option value="Educativo">Educativo</option>
                                    </select>
                                </div>

                                <div className="flex flex-col">
                                    <label className={labelStyles}>Cantidad de Personas <span className="text-error">*</span></label>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="number" min="1" max="50" required
                                            value={formData.visita.cantidad_personas}
                                            onChange={(e) => setFormData({ ...formData, visita: { ...formData.visita, cantidad_personas: parseInt(e.target.value) || 1 } })}
                                            className={cn(inputStyles, "w-32 text-center")}
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Sección: Fecha y Hora */}
                        <section>
                            <div className="flex items-center gap-2 mb-md border-b border-surface-variant pb-2">
                                <span className="material-symbols-outlined text-secondary text-[20px]">calendar_month</span>
                                <h2 className="font-h3 text-h3 text-on-background">Fecha y Horario</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
                                <div className="flex flex-col">
                                    <label className={labelStyles}>Fecha de la Visita <span className="text-error">*</span></label>
                                    <input
                                        type="date"
                                        className={inputStyles}
                                        required
                                        value={formData.visita.fecha}
                                        onChange={(e) => setFormData({ ...formData, visita: { ...formData.visita, fecha: e.target.value } })}
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <label className={labelStyles}>Horario <span className="text-error">*</span></label>
                                    <select
                                        className={inputStyles} required
                                        value={formData.visita.hora_inicio}
                                        onChange={(e) => setFormData({ ...formData, visita: { ...formData.visita, hora_inicio: e.target.value } })}
                                    >
                                        <option value="">Seleccione...</option>
                                        <option value="08:00">08:00</option>
                                        <option value="09:00">09:00</option>
                                        <option value="10:00">10:00</option>
                                        <option value="14:00">14:00</option>
                                        <option value="15:00">15:00</option>
                                    </select>
                                </div>
                            </div>
                        </section>

                        {/* Botones DENTRO del form */}
                        <div className="mt-4 pt-md border-t border-surface-variant flex items-center justify-end gap-4">
                            <Button variant="outline" type="button" onClick={() => navigate(-1)} disabled={loading}>
                                Cancelar
                            </Button>
                            <Button variant="primary" type="submit" disabled={loading}>
                                {loading ? 'Guardando...' : 'Confirmar y Registrar'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};