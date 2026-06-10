import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { cn } from '../utils/cn';
import { TIPOS_VISITA } from '../utils/visitaTypes';
import { ESTADOS_VISITA, BADGE_ESTADO } from '../utils/visitaTypes';
import { useAuth } from '../context/AuthContext';
import { UbicacionSelector } from '../components/ui/UbicacionSelector';

// Sub-componente: Modal genérico
const Modal = ({ titulo, onClose, children }: { titulo: string; onClose: () => void; children: React.ReactNode }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-outline-variant">
                <h3 className="font-bold text-lg text-on-surface">{titulo}</h3>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors">
                    <span className="material-symbols-outlined">close</span>
                </button>
            </div>
            <div className="p-6">{children}</div>
        </div>
    </div>
);


export const EditarVisita = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token } = useAuth();

    const [formData, setFormData] = useState({
        fecha: '',
        hora_inicio: '',
        cantidad_personas: 0,
        estado: '',
        tipo: 'Salón de visitas',
        tiene_cruce_tunel: false,
        tiene_discapacidad: false,
        discapacidad_detalle: '',
        observaciones: ''
    });

    // Guardamos el tipo de visitante para mostrar el label correcto en observaciones
    const [tipoVisitante, setTipoVisitante] = useState<string>('');

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [errorInstitucion, setErrorInstitucion] = useState<string | null>(null);

    // Catálogos
    const [gestores, setGestores] = useState<any[]>([]);
    const [instituciones, setInstituciones] = useState<any[]>([]);

    // Estados de selección de gestor
    const [gestorId, setGestorId] = useState<string>('');
    const [busquedaGestor, setBusquedaGestor] = useState<string>('');
    const [mostrarDropdownGestor, setMostrarDropdownGestor] = useState(false);
    const [nuevoGestor, setNuevoGestor] = useState({ nombre: '', tipo: 'Institución Educativa', empresa_institucion: '', telefono: '', email: '', localidad: '', provincia: '', pais: 'Argentina' });

    // Estados de selección de institución
    const [institucionId, setInstitucionId] = useState<string>('');
    const [busquedaInstitucion, setBusquedaInstitucion] = useState<string>('');
    const [mostrarDropdownInstitucion, setMostrarDropdownInstitucion] = useState(false);
    const [nuevaInstitucion, setNuevaInstitucion] = useState({ nombre: '', telefono: '', email: '', localidad: '', provincia: '', pais: 'Argentina' });

    // Modales
    const [modalGestor, setModalGestor] = useState(false);
    const [modalInstitucion, setModalInstitucion] = useState(false);

    // Carga inicial de catálogos
    useEffect(() => {
        if (!token) return;
        const headers = { 'Authorization': `Bearer ${token}` };
        fetch(`${import.meta.env.VITE_API_URL}/api/gestores`, { headers })
            .then(r => r.json())
            .then(data => { if (Array.isArray(data)) setGestores(data); })
            .catch(() => { });
        fetch(`${import.meta.env.VITE_API_URL}/api/instituciones`, { headers })
            .then(r => r.json())
            .then(data => { if (Array.isArray(data)) setInstituciones(data); })
            .catch(() => { });
    }, [token]);

    useEffect(() => {
        const fetchVisita = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/visitas/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('No se pudo cargar la visita');

                const data = await response.json();

                setTipoVisitante(data.tipo_visitante || '');

                setFormData({
                    fecha: data.fecha.split('T')[0],
                    hora_inicio: data.hora_inicio.slice(0, 5),
                    cantidad_personas: data.cantidad_personas,
                    estado: data.estado,
                    tipo: data.tipo || 'Salón de visitas',
                    tiene_cruce_tunel: data.tiene_cruce_tunel || false,
                    tiene_discapacidad: data.tiene_discapacidad || false,
                    discapacidad_detalle: data.discapacidad_detalle || '',
                    observaciones: data.observaciones || ''
                });

                // Precargar IDs y búsquedas
                setGestorId(data.gestor_id || '');
                setBusquedaGestor(data.gestor_nombre || '');
                setInstitucionId(data.institucion_id || '');
                setBusquedaInstitucion(data.institucion_nombre || '');

            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchVisita();
    }, [id, token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        // Validaciones
        if (!gestorId) {
            setError('El Gestor es obligatorio. Seleccione uno existente o registre uno nuevo.');
            setSaving(false);
            return;
        }

        if (tipoVisitante === 'Institución' && !institucionId) {
            setError('La Institución es obligatoria. Seleccione una existente o registre una nueva.');
            setSaving(false);
            return;
        }

        const dataToSend = {
            ...formData,
            discapacidad_detalle: formData.tiene_discapacidad ? formData.discapacidad_detalle : '',
            gestor_id: gestorId,
            institucion_id: tipoVisitante === 'Institución' ? institucionId : null
        };

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/visitas/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(dataToSend)
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Error al modificar');
            }

            navigate(`/visitas/${id}`);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const gestorSeleccionado = gestores.find(g => g.id === gestorId);
    const institucionSeleccionada = instituciones.find(i => i.id === institucionId);

    // Filtrar gestores según búsqueda
    const gestoresFiltrados = gestores.filter(g =>
        g.nombre.toLowerCase().includes(busquedaGestor.toLowerCase()) ||
        (g.empresa_institucion && g.empresa_institucion.toLowerCase().includes(busquedaGestor.toLowerCase())) ||
        (g.tipo && g.tipo.toLowerCase().includes(busquedaGestor.toLowerCase()))
    );

    const manejarSeleccionarGestor = (id: string) => {
        setGestorId(id);
        const gestor = gestores.find(g => g.id === id);
        setBusquedaGestor(gestor?.nombre || '');
        setMostrarDropdownGestor(false);
    };

    // Filtrar instituciones según búsqueda
    const institucionesFiltradas = instituciones.filter(i =>
        i.nombre.toLowerCase().includes(busquedaInstitucion.toLowerCase()) ||
        (i.localidad && i.localidad.toLowerCase().includes(busquedaInstitucion.toLowerCase())) ||
        (i.provincia && i.provincia.toLowerCase().includes(busquedaInstitucion.toLowerCase()))
    );

    const manejarSeleccionarInstitucion = (id: string) => {
        setInstitucionId(id);
        const institucion = instituciones.find(i => i.id === id);
        setBusquedaInstitucion(institucion?.nombre || '');
        setMostrarDropdownInstitucion(false);
    };

    const handleGuardarGestor = async () => {
        if (!nuevoGestor.nombre) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/gestores`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(nuevoGestor)
            });
            const data = await res.json();
            if (res.ok) {
                setGestores(prev => [...prev, data.gestor]);
                manejarSeleccionarGestor(data.gestor.id);
                setModalGestor(false);
                setNuevoGestor({ nombre: '', tipo: 'Institución Educativa', empresa_institucion: '', telefono: '', email: '', localidad: '', provincia: '', pais: 'Argentina' });
            } else {
                setError(data.error || 'Error al registrar el gestor.');
            }
        } catch {
            setError('Error al registrar el gestor.');
        }
    };

    const handleGuardarInstitucion = async () => {
        if (!nuevaInstitucion.nombre) return;
        setErrorInstitucion(null);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/instituciones`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(nuevaInstitucion)
            });
            const data = await res.json();
            if (res.ok) {
                setInstituciones(prev => [...prev, data.institucion]);
                manejarSeleccionarInstitucion(data.institucion.id);
                setModalInstitucion(false);
                setNuevaInstitucion({ nombre: '', telefono: '', email: '', localidad: '', provincia: '', pais: 'Argentina' });
                setErrorInstitucion(null);
            } else {
                setErrorInstitucion(data.error || 'Error al registrar la institución.');
            }
        } catch {
            setErrorInstitucion('Error al registrar la institución.');
        }
    };

    const inputStyles = "w-full h-11 px-4 rounded-lg border border-outline-variant bg-surface-bright text-on-background focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none transition-all";
    const textareaStyles = "w-full px-4 py-3 rounded-lg border border-outline-variant bg-surface-bright text-on-background focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none transition-all resize-none";

    // Label descriptivo según tipo de visitante
    const labelObservaciones = tipoVisitante === 'Institución'
        ? 'Observaciones sobre la institución o el grupo escolar'
        : tipoVisitante === 'Particulares'
            ? 'Observaciones sobre el grupo de particulares'
            : 'Observaciones';

    if (loading) return <div className="p-8 text-center animate-pulse">Cargando datos...</div>;

    return (
        <>
            <div className="flex flex-col max-w-[800px] w-full mx-auto bg-surface-container-lowest p-8 rounded-3xl shadow-sm border border-outline-variant">
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-surface-container-low text-on-surface-variant transition-colors">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div>
                        <h1 className="font-h2 text-h2 text-on-surface">Modificar Visita</h1>
                        <p className="font-body-md text-on-surface-variant">Actualice los datos de agenda, requerimientos y observaciones.</p>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-error-container/20 border border-error/50 rounded-lg text-error text-sm font-medium">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-6">

                    {/* Gestor */}
                    <div className="grid grid-cols-1 gap-6 bg-surface-container-low p-6 rounded-2xl border border-surface-container">
                        <h3 className="font-bold text-primary flex items-center gap-2 mb-2">
                            <span className="material-symbols-outlined text-[20px]">manage_accounts</span>
                            Gestor Responsable
                        </h3>

                        {gestorId && gestorSeleccionado ? (
                            <div className="flex items-center justify-between p-3 bg-white border border-outline-variant rounded-xl">
                                <div>
                                    <p className="font-bold text-on-surface">{gestorSeleccionado.nombre}</p>
                                    {gestorSeleccionado.empresa_institucion && <p className="text-sm text-on-surface-variant">{gestorSeleccionado.empresa_institucion}</p>}
                                    {gestorSeleccionado.tipo && <p className="text-xs text-on-surface-variant">{gestorSeleccionado.tipo}</p>}
                                </div>
                                <button type="button" onClick={() => { setGestorId(''); setBusquedaGestor(''); }} className="text-xs text-secondary hover:underline font-bold">Cambiar</button>
                            </div>
                        ) : (
                            <div className="flex gap-3 relative">
                                <div className="flex-1 relative">
                                    <input
                                        type="text"
                                        className={inputStyles}
                                        placeholder="Escribe el nombre, institución o tipo del gestor..."
                                        value={busquedaGestor}
                                        onChange={e => {
                                            setBusquedaGestor(e.target.value);
                                            setGestorId('');
                                            setMostrarDropdownGestor(true);
                                        }}
                                        onFocus={() => setMostrarDropdownGestor(true)}
                                        onBlur={() => setTimeout(() => setMostrarDropdownGestor(false), 200)}
                                    />
                                    {/* Dropdown dinámico */}
                                    {mostrarDropdownGestor && (busquedaGestor || gestoresFiltrados.length > 0) && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-outline-variant rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
                                            {gestoresFiltrados.length > 0 ? (
                                                gestoresFiltrados.map(g => (
                                                    <button
                                                        key={g.id}
                                                        type="button"
                                                        onMouseDown={e => { e.preventDefault(); manejarSeleccionarGestor(g.id); }}
                                                        className="w-full text-left px-4 py-2 hover:bg-secondary/10 border-b border-outline-variant/50 last:border-b-0 transition-colors"
                                                    >
                                                        <p className="font-medium text-on-surface">{g.nombre}</p>
                                                        <p className="text-xs text-on-surface-variant">
                                                            {g.tipo ? `${g.tipo}` : ''} {g.empresa_institucion ? `· ${g.empresa_institucion}` : ''}
                                                        </p>
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="px-4 py-3 text-center text-sm text-on-surface-variant">
                                                    No se encontraron gestores
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <Button type="button" variant="outline" onClick={() => setModalGestor(true)}>
                                    <span className="material-symbols-outlined text-[18px]">add</span> Nuevo
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Institución */}
                    {tipoVisitante === 'Institución' && (
                        <div className="grid grid-cols-1 gap-6 bg-surface-container-low p-6 rounded-2xl border border-surface-container">
                            <h3 className="font-bold text-primary flex items-center gap-2 mb-2">
                                <span className="material-symbols-outlined text-[20px]">school</span>
                                Institución Educativa
                            </h3>

                            {institucionId && institucionSeleccionada ? (
                                <div className="flex items-center justify-between p-3 bg-white border border-outline-variant rounded-xl">
                                    <div>
                                        <p className="font-bold text-on-surface">{institucionSeleccionada.nombre}</p>
                                        {institucionSeleccionada.localidad && <p className="text-sm text-on-surface-variant">{institucionSeleccionada.localidad}, {institucionSeleccionada.provincia}</p>}
                                    </div>
                                    <button type="button" onClick={() => { setInstitucionId(''); setBusquedaInstitucion(''); }} className="text-xs text-secondary hover:underline font-bold">Cambiar</button>
                                </div>
                            ) : (
                                <div className="flex gap-3 relative">
                                    <div className="flex-1 relative">
                                        <input
                                            type="text"
                                            className={inputStyles}
                                            placeholder="Escribe el nombre, localidad o provincia de la institución..."
                                            value={busquedaInstitucion}
                                            onChange={e => {
                                                setBusquedaInstitucion(e.target.value);
                                                setInstitucionId('');
                                                setMostrarDropdownInstitucion(true);
                                            }}
                                            onFocus={() => setMostrarDropdownInstitucion(true)}
                                            onBlur={() => setTimeout(() => setMostrarDropdownInstitucion(false), 200)}
                                        />
                                        {/* Dropdown dinámico */}
                                        {mostrarDropdownInstitucion && (busquedaInstitucion || institucionesFiltradas.length > 0) && (
                                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-outline-variant rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
                                                {institucionesFiltradas.length > 0 ? (
                                                    institucionesFiltradas.map(i => (
                                                        <button
                                                            key={i.id}
                                                            type="button"
                                                            onMouseDown={e => { e.preventDefault(); manejarSeleccionarInstitucion(i.id); }}
                                                            className="w-full text-left px-4 py-2 hover:bg-secondary/10 border-b border-outline-variant/50 last:border-b-0 transition-colors"
                                                        >
                                                            <p className="font-medium text-on-surface">{i.nombre}</p>
                                                            <p className="text-xs text-on-surface-variant">
                                                                {i.localidad ? `${i.localidad}` : ''} {i.provincia ? `· ${i.provincia}` : ''}
                                                            </p>
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="px-4 py-3 text-center text-sm text-on-surface-variant">
                                                        No se encontraron instituciones
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <Button type="button" variant="outline" onClick={() => setModalInstitucion(true)}>
                                        <span className="material-symbols-outlined text-[18px]">add</span> Nueva
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* 1. Agenda y Turno */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-surface-container-low p-6 rounded-2xl border border-surface-container">
                        <h3 className="md:col-span-2 font-bold text-primary flex items-center gap-2 mb-2">
                            <span className="material-symbols-outlined text-[20px]">calendar_month</span>
                            Agenda y Horario
                        </h3>

                        <div>
                            <label className="font-label-sm block mb-1">Fecha</label>
                            <input type="date" required value={formData.fecha} onChange={(e) => setFormData({ ...formData, fecha: e.target.value })} className={inputStyles} />
                        </div>
                        <div>
                            <label className="font-label-sm block mb-1">Hora de Inicio</label>
                            <input type="time" required step="1800" value={formData.hora_inicio} onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })} className={inputStyles} />
                        </div>
                        <div>
                            <label className="font-label-sm block mb-1">Tipo de Visita</label>
                            <select value={formData.tipo} onChange={(e) => setFormData({ ...formData, tipo: e.target.value })} className={cn(inputStyles, "cursor-pointer")}>
                                {TIPOS_VISITA.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="font-label-sm block mb-1">Cantidad de Personas</label>
                            <input type="number" min="1" required value={formData.cantidad_personas} onChange={(e) => setFormData({ ...formData, cantidad_personas: parseInt(e.target.value) || 0 })} className={inputStyles} />
                        </div>
                    </div>

                    {/* 2. Requerimientos Especiales y Observaciones */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-surface-container-low p-6 rounded-2xl border border-surface-container">
                        <h3 className="md:col-span-2 font-bold text-primary flex items-center gap-2 mb-2">
                            <span className="material-symbols-outlined text-[20px]">tune</span>
                            Requerimientos y Observaciones
                        </h3>

                        <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-outline-variant">
                            <input
                                type="checkbox" id="cruce" className="w-5 h-5 accent-primary cursor-pointer"
                                checked={formData.tiene_cruce_tunel}
                                onChange={(e) => setFormData({ ...formData, tiene_cruce_tunel: e.target.checked })}
                            />
                            <label htmlFor="cruce" className="font-medium cursor-pointer">Realiza cruce del túnel</label>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-outline-variant">
                            <input
                                type="checkbox" id="discapacidad" className="w-5 h-5 accent-secondary cursor-pointer"
                                checked={formData.tiene_discapacidad}
                                onChange={(e) => setFormData({ ...formData, tiene_discapacidad: e.target.checked })}
                            />
                            <label htmlFor="discapacidad" className="font-medium text-secondary cursor-pointer">Requiere Accesibilidad</label>
                        </div>

                        {formData.tiene_discapacidad && (
                            <div className="md:col-span-2">
                                <label className="font-label-sm block mb-1 text-secondary">Detalle de Accesibilidad</label>
                                <input
                                    type="text"
                                    placeholder="Ej: Dos personas en silla de ruedas..."
                                    required={formData.tiene_discapacidad}
                                    value={formData.discapacidad_detalle}
                                    onChange={(e) => setFormData({ ...formData, discapacidad_detalle: e.target.value })}
                                    className={cn(inputStyles, "border-secondary/30 focus:border-secondary")}
                                />
                            </div>
                        )}

                        {/* Campo Observaciones */}
                        <div className="md:col-span-2">
                            <label className="font-label-sm block mb-1 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[15px] text-on-surface-variant">notes</span>
                                {labelObservaciones}
                                <span className="text-outline font-normal ml-1">(opcional)</span>
                            </label>
                            <textarea
                                rows={3}
                                placeholder="Ingrese cualquier observación relevante sobre el grupo o la visita..."
                                value={formData.observaciones}
                                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                                className={textareaStyles}
                            />
                        </div>
                    </div>

                    {/* 3. Estado */}
                    <div>
                        <label className="font-label-sm block mb-2 text-on-surface-variant uppercase tracking-wider">Estado de la Visita</label>
                        <div className="flex items-center gap-3 mb-3">
                            <span className="text-sm text-on-surface-variant">Actual:</span>
                            <span className={cn(
                                "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest",
                                BADGE_ESTADO[formData.estado] ?? 'bg-surface-container text-outline border border-outline-variant'
                            )}>
                                {formData.estado}
                            </span>
                        </div>
                        <select
                            value={formData.estado}
                            onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                            className={cn(inputStyles, "cursor-pointer font-bold text-on-surface")}
                        >
                            {ESTADOS_VISITA.map(e => (
                                <option key={e} value={e}>{e}</option>
                            ))}
                        </select>
                    </div>

                    {/* Botones */}
                    <div className="flex justify-end gap-3 mt-4 pt-6 border-t border-surface-container-highest">
                        <Button variant="outline" type="button" onClick={() => navigate(-1)}>
                            Descartar Cambios
                        </Button>
                        <Button variant="primary" type="submit" disabled={saving}>
                            {saving ? 'Guardando...' : 'Guardar Cambios'}
                        </Button>
                    </div>
                </form>
            </div>

            {/* Modales */}
            {/* ── Modal Nuevo Gestor ── */}
            {modalGestor && (
                <Modal titulo="Registrar Nuevo Gestor" onClose={() => setModalGestor(false)}>
                    <div className="space-y-3">
                        <div className="grid grid-cols-1 gap-3">
                            <div>
                                <label className="text-xs font-bold text-outline uppercase">Nombre *</label>
                                <input className={inputStyles} placeholder="Ej: Juan Pérez" value={nuevoGestor.nombre} onChange={e => setNuevoGestor({ ...nuevoGestor, nombre: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-outline uppercase">Tipo de Gestor *</label>
                                <select className={cn(inputStyles, "cursor-pointer")} value={nuevoGestor.tipo} onChange={e => setNuevoGestor({ ...nuevoGestor, tipo: e.target.value })}>
                                    <option value="Institución Educativa">Institución Educativa</option>
                                    <option value="Agencia de Turismo">Agencia de Turismo</option>
                                    <option value="Club / Asociación">Club / Asociación</option>
                                    <option value="Particular / Organismo Público">Particular / Organismo Público</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-outline uppercase">Empresa / Institución</label>
                                <input className={inputStyles} placeholder="Ej: Escuela Nº 5 de Paraná" value={nuevoGestor.empresa_institucion} onChange={e => setNuevoGestor({ ...nuevoGestor, empresa_institucion: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-outline uppercase">Teléfono</label>
                                    <input className={inputStyles} placeholder="Cod. Área + Número" value={nuevoGestor.telefono} onChange={e => setNuevoGestor({ ...nuevoGestor, telefono: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-outline uppercase">Email</label>
                                    <input type="email" className={inputStyles} placeholder="contacto@institucion.edu.ar" value={nuevoGestor.email} onChange={e => setNuevoGestor({ ...nuevoGestor, email: e.target.value })} />
                                </div>
                            </div>
                        </div>
                        <UbicacionSelector
                            value={{ localidad: nuevoGestor.localidad, provincia: nuevoGestor.provincia, pais: nuevoGestor.pais }}
                            onChange={({ localidad, provincia, pais }) =>
                                setNuevoGestor({ ...nuevoGestor, localidad, provincia, pais })
                            }
                            inputClassName="h-11 text-sm bg-surface-bright"
                        />
                        <div className="flex justify-end gap-3 pt-2">
                            <Button variant="outline" type="button" onClick={() => setModalGestor(false)}>Cancelar</Button>
                            <Button variant="primary" type="button" onClick={handleGuardarGestor} disabled={!nuevoGestor.nombre}>Guardar Gestor</Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* ── Modal Nueva Institución ── */}
            {modalInstitucion && (
                <Modal titulo="Registrar Nueva Institución" onClose={() => { setModalInstitucion(false); setErrorInstitucion(null); }}>
                    <div className="space-y-3">
                        {errorInstitucion && (
                            <div className="p-3 bg-error-container/20 border border-error/50 rounded-lg text-error text-sm font-medium flex items-center gap-2">
                                <span className="material-symbols-outlined text-[18px]">error</span>
                                <span className="flex-1 text-left">{errorInstitucion}</span>
                            </div>
                        )}
                        <div>
                            <label className="text-xs font-bold text-outline uppercase">Nombre *</label>
                            <input className={inputStyles} placeholder="Ej: Colegio San Martín" value={nuevaInstitucion.nombre} onChange={e => setNuevaInstitucion({ ...nuevaInstitucion, nombre: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-bold text-outline uppercase">Teléfono</label>
                                <input className={inputStyles} value={nuevaInstitucion.telefono} onChange={e => setNuevaInstitucion({ ...nuevaInstitucion, telefono: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-outline uppercase">Email institucional</label>
                                <input type="email" className={inputStyles} value={nuevaInstitucion.email} onChange={e => setNuevaInstitucion({ ...nuevaInstitucion, email: e.target.value })} />
                            </div>
                        </div>
                        <UbicacionSelector
                            value={{ localidad: nuevaInstitucion.localidad, provincia: nuevaInstitucion.provincia, pais: nuevaInstitucion.pais }}
                            onChange={({ localidad, provincia, pais }) =>
                                setNuevaInstitucion({ ...nuevaInstitucion, localidad, provincia, pais })
                            }
                            inputClassName="h-11 text-sm bg-surface-bright"
                        />
                        <div className="flex justify-end gap-3 pt-2">
                            <Button variant="outline" type="button" onClick={() => setModalInstitucion(false)}>Cancelar</Button>
                            <Button variant="primary" type="button" onClick={handleGuardarInstitucion} disabled={!nuevaInstitucion.nombre}>Guardar Institución</Button>
                        </div>
                    </div>
                </Modal>
            )}
        </>
    );
};