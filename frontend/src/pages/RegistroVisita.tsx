import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { TIPOS_VISITA } from '../utils/visitaTypes';
import { cn } from '../utils/cn';
import { useAuth } from '../context/AuthContext';
import { UbicacionSelector } from '../components/ui/UbicacionSelector';

// Sincronizado con el backend — visita.service.ts
const NIVELES_EDUCATIVOS = ['Infantes', 'Primario', 'Secundario', 'Terciario', 'Universitario', 'Adultos Mayores'];

// ──────────────────────────────────────────
// Sub-componente: Modal genérico
// ──────────────────────────────────────────
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

// ──────────────────────────────────────────
// Componente principal
// ──────────────────────────────────────────
export const RegistroVisita = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { token } = useAuth();
    const fechaInicial = searchParams.get('fecha') || new Date().toISOString().split('T')[0];
    const horaInicial = searchParams.get('hora') || '';

    // Catálogos
    const [gestores, setGestores] = useState<any[]>([]);
    const [instituciones, setInstituciones] = useState<any[]>([]);

    // UI modales
    const [modalGestor, setModalGestor] = useState(false);
    const [modalInstitucion, setModalInstitucion] = useState(false);
    const [modalConfirmar, setModalConfirmar] = useState(false);
    const [enviando, setEnviando] = useState(false);
    const [payloadPendiente, setPayloadPendiente] = useState<any>(null);

    // Error
    const [errorSubmit, setErrorSubmit] = useState<string | null>(null);

    // ── Estado del formulario ──
    const [gestor_id, setGestorId] = useState('');
    const [busquedaGestor, setBusquedaGestor] = useState('');
    const [mostrarDropdownGestor, setMostrarDropdownGestor] = useState(false);
    const [nuevoGestor, setNuevoGestor] = useState({ nombre: '', tipo: 'Institución Educativa', empresa_institucion: '', telefono: '', email: '', localidad: '', provincia: '', pais: 'Argentina' });

    const [tipoVisitante, setTipoVisitante] = useState<'Institución' | 'Particulares'>('Institución');

    // Institución
    const [institucion_id, setInstitucionId] = useState('');
    const [busquedaInstitucion, setBusquedaInstitucion] = useState('');
    const [mostrarDropdownInstitucion, setMostrarDropdownInstitucion] = useState(false);
    const [nuevaInstitucion, setNuevaInstitucion] = useState({ nombre: '', telefono: '', email: '', localidad: '', provincia: '', pais: 'Argentina' });
    const [nivelEducativo, setNivelEducativo] = useState('Primario');

    // Particulares
    const [particulares, setParticulares] = useState({ nombre: '', tipoMenores: true, tipoAdultos: false, telefono: '', email: '', localidad: '', provincia: '', pais: 'Argentina' });

    // Observaciones
    const [observaciones, setObservaciones] = useState('');

    // Visita
    const [visita, setVisita] = useState({
        fecha: fechaInicial,
        hora_inicio: horaInicial,
        tipo: 'Salón de visitas',
        tiene_cruce_tunel: false,
        cantidad_personas: '',
        tiene_discapacidad: false,
        discapacidad_detalle: ''
    });

    // Horarios disponibles
    const horarios = (() => {
        const slots: string[] = [];
        for (let h = 8; h <= 17; h++) {
            const hh = h < 10 ? `0${h}` : `${h}`;
            slots.push(`${hh}:00`);
            slots.push(`${hh}:30`);
        }
        return slots;
    })();

    // Carga inicial de catálogos
    useEffect(() => {
        if (!token) return; // Esperar a que el token esté disponible
        const headers = { 'Authorization': `Bearer ${token}` };
        fetch(`${import.meta.env.VITE_API_URL}/api/gestores`, { headers })
            .then(r => r.json())
            .then(data => { if (Array.isArray(data)) setGestores(data); })
            .catch(() => { });
        fetch(`${import.meta.env.VITE_API_URL}/api/instituciones`, { headers })
            .then(r => r.json())
            .then(data => { if (Array.isArray(data)) setInstituciones(data); })
            .catch(() => { });
    }, [token]); // Re-ejecutar cuando el token esté listo

    // ── Guardar nuevo gestor desde modal ──
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
            }
        } catch {
            setErrorSubmit('Error al registrar el gestor.');
        }
    };

    // ── Guardar nueva institución desde modal ──
    const handleGuardarInstitucion = async () => {
        if (!nuevaInstitucion.nombre) return;
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
            }
        } catch { }
    };

    // ── Submit: valida y abre modal de confirmación ──
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrorSubmit(null);

        // Validar Gestor obligatorio
        if (!gestor_id && !nuevoGestor.nombre.trim()) {
            setErrorSubmit('El Gestor es obligatorio. Seleccione uno existente o registre uno nuevo.');
            return;
        }

        // Validar Institución / Particulares obligatorio
        if (tipoVisitante === 'Institución') {
            if (!institucion_id && !nuevaInstitucion.nombre.trim()) {
                setErrorSubmit('La Institución es obligatoria. Seleccione una existente o registre una nueva.');
                return;
            }
        }

        if (tipoVisitante === 'Particulares') {
            if (!particulares.nombre.trim()) {
                setErrorSubmit('El nombre del grupo de Particulares es obligatorio.');
                return;
            }
            if (!particulares.tipoMenores && !particulares.tipoAdultos) {
                setErrorSubmit('Debe seleccionar al menos un tipo de grupo (Menores, Adultos o Mixto).');
                return;
            }
        }

        const tipoGrupoComputado = particulares.tipoMenores && particulares.tipoAdultos
            ? 'Mixto'
            : particulares.tipoMenores ? 'Menores' : 'Adultos';

        const payload = {
            gestor_id: gestor_id || null,
            nuevoGestor: gestor_id ? null : nuevoGestor,
            grupo: tipoVisitante === 'Institución'
                ? { tipo_visitante: 'Institución', institucion_id: institucion_id || null, nuevaInstitucion: institucion_id ? null : nuevaInstitucion, nivel_educativo: nivelEducativo, observaciones }
                : { tipo_visitante: 'Particulares', nombre: particulares.nombre, tipo_grupo: tipoGrupoComputado, telefono: particulares.telefono, email: particulares.email, localidad: particulares.localidad, provincia: particulares.provincia, pais: particulares.pais, observaciones },
            visita
        };

        setPayloadPendiente(payload);
        setModalConfirmar(true);
    };

    // ── Confirmación real: envía al backend ──
    const handleConfirmar = async () => {
        if (!payloadPendiente) return;
        setEnviando(true);
        setErrorSubmit(null);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/visitas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payloadPendiente)
            });
            if (res.ok) {
                const data = await res.json();
                const visitaId = data.visita_id;

                // Generar y descargar el comprobante en PDF
                try {
                    const resPdf = await fetch(
                        `${import.meta.env.VITE_API_URL}/api/estadisticas/exportar/visita/${visitaId}`,
                        { headers: { 'Authorization': `Bearer ${token}` } }
                    );
                    if (resPdf.ok) {
                        const blob = await resPdf.blob();
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;

                        // Formatear fecha para el nombre del archivo (formato DD-MM-AAAA)
                        const dateStr = visita.fecha.includes('T') ? visita.fecha.split('T')[0] : visita.fecha;
                        const parts = dateStr.split('-');
                        const fechaStr = parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : dateStr;

                        a.download = `Comprobante_visita_${fechaStr}.pdf`;
                        a.click();
                        URL.revokeObjectURL(url);
                    }
                } catch (errPdf) {
                    console.error('Error al descargar el comprobante PDF:', errPdf);
                }

                navigate(`/dashboard?fecha=${visita.fecha}`);
            } else {
                const data = await res.json();
                setModalConfirmar(false);
                setErrorSubmit(data.error || 'Error al registrar la visita.');
            }
        } catch {
            setModalConfirmar(false);
            setErrorSubmit('Error de conexión con el servidor.');
        } finally {
            setEnviando(false);
        }
    };

    const inp = "w-full h-10 px-3 rounded-lg border border-outline-variant bg-white outline-none focus:border-primary transition-all text-sm";
    const sectionCls = "bg-surface-container-low p-6 rounded-xl border border-surface-container space-y-4";

    const gestorSeleccionado = gestores.find(g => g.id === gestor_id);
    const institucionSeleccionada = instituciones.find(i => i.id === institucion_id);

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

    // Datos legibles para el modal de confirmación
    const nombreGestorConfirm = gestorSeleccionado?.nombre || nuevoGestor.nombre || '—';
    const empresaGestorConfirm = gestorSeleccionado?.empresa_institucion || nuevoGestor.empresa_institucion || null;
    const esInstConfirm = tipoVisitante === 'Institución';
    const nombreGrupoConfirm = esInstConfirm
        ? (institucionSeleccionada?.nombre || nuevaInstitucion.nombre || '—')
        : (particulares.nombre || '—');
    const fechaConfirm = (() => {
        try {
            const [y, m, d] = visita.fecha.split('-');
            return `${parseInt(d)}/${parseInt(m)}/${y}`;
        } catch { return visita.fecha; }
    })();

    return (
        <>
            {/* ── Modal de Confirmación ── */}
            {modalConfirmar && payloadPendiente && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden">
                        {/* Header */}
                        <div className="bg-primary px-6 py-5 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-white text-[22px]">fact_check</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-white leading-tight">Confirmar Registro de Visita</h3>
                                <p className="text-white/70 text-xs">Revisá los datos antes de confirmar</p>
                            </div>
                            <button onClick={() => setModalConfirmar(false)} className="ml-auto p-1 rounded-full hover:bg-white/20 text-white transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        {/* Cuerpo */}
                        <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">

                            {/* Turno */}
                            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                                <p className="text-xs font-bold text-primary uppercase tracking-wider mb-3 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[14px]">calendar_month</span>
                                    Turno
                                </p>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <p className="text-xs text-on-surface-variant font-medium">Fecha</p>
                                        <p className="font-bold text-on-surface">{fechaConfirm}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-on-surface-variant font-medium">Hora</p>
                                        <p className="font-bold text-on-surface">{visita.hora_inicio} hs</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-on-surface-variant font-medium">Tipo de visita</p>
                                        <p className="font-semibold text-on-surface">{visita.tipo}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-on-surface-variant font-medium">Cantidad de personas</p>
                                        <p className="font-bold text-on-surface">{visita.cantidad_personas}</p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {visita.tiene_cruce_tunel && (
                                        <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold">
                                            <span className="material-symbols-outlined text-[13px]">swap_horiz</span>
                                            Cruce del túnel
                                        </span>
                                    )}
                                    {visita.tiene_discapacidad && (
                                        <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-secondary/10 border border-secondary/30 text-secondary text-xs font-bold">
                                            <span className="material-symbols-outlined text-[13px]">accessible_forward</span>
                                            Accesibilidad
                                            {visita.discapacidad_detalle && `: ${visita.discapacidad_detalle}`}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Gestor */}
                            <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4">
                                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[14px]">manage_accounts</span>
                                    Gestor responsable
                                </p>
                                <p className="font-bold text-on-surface text-sm">{nombreGestorConfirm}</p>
                                {empresaGestorConfirm && <p className="text-xs text-on-surface-variant mt-0.5">{empresaGestorConfirm}</p>}
                                {!gestor_id && <span className="inline-block mt-1 px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold rounded-full">Nuevo gestor</span>}
                            </div>

                            {/* Grupo */}
                            <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4">
                                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[14px]">{esInstConfirm ? 'school' : 'group'}</span>
                                    {esInstConfirm ? 'Institución educativa' : 'Grupo particular'}
                                </p>
                                <p className="font-bold text-on-surface text-sm">{nombreGrupoConfirm}</p>
                                {esInstConfirm ? (
                                    <div className="mt-2 text-xs text-on-surface-variant space-y-0.5">
                                        <p>Nivel educativo: <span className="font-semibold text-on-surface">{payloadPendiente.grupo.nivel_educativo}</span></p>
                                        {institucion_id && institucionSeleccionada ? (
                                            <>
                                                {(institucionSeleccionada.localidad || institucionSeleccionada.provincia) && (
                                                    <p>Localidad: <span className="font-semibold text-on-surface">{institucionSeleccionada.localidad || 'No especificado'}, {institucionSeleccionada.provincia || 'No especificado'}</span></p>
                                                )}
                                                <p>País: <span className="font-semibold text-on-surface">{institucionSeleccionada.pais || 'Argentina'}</span></p>
                                            </>
                                        ) : (
                                            <>
                                                <p>Localidad: <span className="font-semibold text-on-surface">{nuevaInstitucion.localidad || 'No especificado'}, {nuevaInstitucion.provincia || 'No especificado'}</span></p>
                                                <p>País: <span className="font-semibold text-on-surface">{nuevaInstitucion.pais || 'Argentina'}</span></p>
                                                <span className="inline-block mt-1 px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold rounded-full">Nueva institución</span>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <div className="mt-2 text-xs text-on-surface-variant space-y-0.5">
                                        <p>Tipo de grupo: <span className="font-semibold text-on-surface">{payloadPendiente.grupo.tipo_grupo}</span></p>
                                        {payloadPendiente.grupo.telefono && <p>Tel: <span className="font-semibold text-on-surface">{payloadPendiente.grupo.telefono}</span></p>}
                                        {payloadPendiente.grupo.email && <p>Email: <span className="font-semibold text-on-surface">{payloadPendiente.grupo.email}</span></p>}
                                        {(payloadPendiente.grupo.localidad || payloadPendiente.grupo.provincia) && (
                                            <p>Localidad: <span className="font-semibold text-on-surface">{payloadPendiente.grupo.localidad || 'No especificado'}, {payloadPendiente.grupo.provincia || 'No especificado'}</span></p>
                                        )}
                                        <p>País: <span className="font-semibold text-on-surface">{payloadPendiente.grupo.pais || 'Argentina'}</span></p>
                                    </div>
                                )}
                            </div>

                            {/* Observaciones */}
                            {observaciones && (
                                <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4">
                                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[14px]">notes</span>
                                        Observaciones
                                    </p>
                                    <p className="text-sm text-on-surface italic">{observaciones}</p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 bg-surface-container-low border-t border-outline-variant flex justify-end gap-3">
                            <Button variant="outline" type="button" onClick={() => setModalConfirmar(false)} disabled={enviando}>
                                Volver a editar
                            </Button>
                            <Button variant="primary" type="button" onClick={handleConfirmar} disabled={enviando}>
                                {enviando
                                    ? <><span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span> Registrando...</>
                                    : <><span className="material-symbols-outlined text-[18px]">check_circle</span> Confirmar Visita</>
                                }
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Modal Nuevo Gestor ── */}
            {modalGestor && (
                <Modal titulo="Registrar Nuevo Gestor" onClose={() => setModalGestor(false)}>
                    <div className="space-y-3">
                        <div className="grid grid-cols-1 gap-3">
                            <div>
                                <label className="text-xs font-bold text-outline uppercase">Nombre *</label>
                                <input className={inp} placeholder="Ej: Juan Pérez" value={nuevoGestor.nombre} onChange={e => setNuevoGestor({ ...nuevoGestor, nombre: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-outline uppercase">Tipo de Gestor *</label>
                                <select className={cn(inp, "cursor-pointer")} value={nuevoGestor.tipo} onChange={e => setNuevoGestor({ ...nuevoGestor, tipo: e.target.value })}>
                                    <option value="Institución Educativa">Institución Educativa</option>
                                    <option value="Agencia de Turismo">Agencia de Turismo</option>
                                    <option value="Club / Asociación">Club / Asociación</option>
                                    <option value="Particular / Organismo Público">Particular / Organismo Público</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-outline uppercase">Empresa / Institución</label>
                                <input className={inp} placeholder="Ej: Escuela Nº 5 de Paraná" value={nuevoGestor.empresa_institucion} onChange={e => setNuevoGestor({ ...nuevoGestor, empresa_institucion: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-outline uppercase">Teléfono</label>
                                    <input className={inp} placeholder="Cod. Área + Número" value={nuevoGestor.telefono} onChange={e => setNuevoGestor({ ...nuevoGestor, telefono: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-outline uppercase">Email</label>
                                    <input type="email" className={inp} placeholder="contacto@institucion.edu.ar" value={nuevoGestor.email} onChange={e => setNuevoGestor({ ...nuevoGestor, email: e.target.value })} />
                                </div>
                            </div>
                        </div>
                        <UbicacionSelector
                            value={{ localidad: nuevoGestor.localidad, provincia: nuevoGestor.provincia, pais: nuevoGestor.pais }}
                            onChange={({ localidad, provincia, pais }) =>
                                setNuevoGestor({ ...nuevoGestor, localidad, provincia, pais })
                            }
                            inputClassName="h-10 text-sm"
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
                <Modal titulo="Registrar Nueva Institución" onClose={() => setModalInstitucion(false)}>
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs font-bold text-outline uppercase">Nombre *</label>
                            <input className={inp} placeholder="Ej: Colegio San Martín" value={nuevaInstitucion.nombre} onChange={e => setNuevaInstitucion({ ...nuevaInstitucion, nombre: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-bold text-outline uppercase">Teléfono</label>
                                <input className={inp} value={nuevaInstitucion.telefono} onChange={e => setNuevaInstitucion({ ...nuevaInstitucion, telefono: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-outline uppercase">Email institucional</label>
                                <input type="email" className={inp} value={nuevaInstitucion.email} onChange={e => setNuevaInstitucion({ ...nuevaInstitucion, email: e.target.value })} />
                            </div>
                        </div>
                        <UbicacionSelector
                            value={{ localidad: nuevaInstitucion.localidad, provincia: nuevaInstitucion.provincia, pais: nuevaInstitucion.pais }}
                            onChange={({ localidad, provincia, pais }) =>
                                setNuevaInstitucion({ ...nuevaInstitucion, localidad, provincia, pais })
                            }
                            inputClassName="h-10 text-sm"
                        />
                        <div className="flex justify-end gap-3 pt-2">
                            <Button variant="outline" type="button" onClick={() => setModalInstitucion(false)}>Cancelar</Button>
                            <Button variant="primary" type="button" onClick={handleGuardarInstitucion} disabled={!nuevaInstitucion.nombre}>Guardar Institución</Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* ── Formulario Principal ── */}
            <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-6 space-y-6">
                <h1 className="text-h2 font-h2">Registrar Nueva Visita</h1>

                {errorSubmit && (
                    <div className="p-4 bg-error-container/20 border border-error/50 rounded-lg text-error text-sm font-medium flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">error</span>
                        {errorSubmit}
                    </div>
                )}

                {/* ── SECCIÓN 1: GESTOR ── */}
                <section className={sectionCls}>
                    <h3 className="font-h3 flex items-center gap-2">
                        <span className="material-symbols-outlined">manage_accounts</span> 1. Gestor
                    </h3>

                    {gestor_id && gestorSeleccionado ? (
                        <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg">
                            <div>
                                <p className="font-bold text-on-surface">{gestorSeleccionado.nombre}</p>
                                {gestorSeleccionado.empresa_institucion && <p className="text-sm text-on-surface-variant">{gestorSeleccionado.empresa_institucion}</p>}
                                {gestorSeleccionado.tipo && <p className="text-xs text-on-surface-variant">{gestorSeleccionado.tipo}</p>}
                            </div>
                            <button type="button" onClick={() => { setGestorId(''); setBusquedaGestor(''); }} className="text-xs text-primary hover:underline">Cambiar</button>
                        </div>
                    ) : (
                        <div className="flex gap-3 relative">
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    className={inp}
                                    placeholder="Escribe el nombre, institución o tipo..."
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
                                                    className="w-full text-left px-4 py-2 hover:bg-primary/10 border-b border-outline-variant/50 last:border-b-0 transition-colors"
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
                </section>

                {/* ── SECCIÓN 2: GRUPO VISITANTE ── */}
                <section className={sectionCls}>
                    <h3 className="font-h3 flex items-center gap-2">
                        <span className="material-symbols-outlined">groups</span> 2. Grupo Visitante
                    </h3>

                    {/* Toggle Institución / Particulares */}
                    <div className="flex gap-2 p-1 bg-surface-container rounded-xl w-fit">
                        {(['Institución', 'Particulares'] as const).map(tipo => (
                            <button
                                key={tipo}
                                type="button"
                                onClick={() => {
                                    setTipoVisitante(tipo);
                                    // Si cambia a Particulares, el cruce siempre es false
                                    if (tipo === 'Particulares') {
                                        setVisita(v => ({ ...v, tiene_cruce_tunel: false }));
                                    }
                                }}
                                className={cn(
                                    'px-5 py-2 rounded-lg text-sm font-bold transition-all',
                                    tipoVisitante === tipo
                                        ? 'bg-primary text-white shadow-sm'
                                        : 'text-on-surface-variant hover:bg-surface-container-low'
                                )}
                            >
                                {tipo === 'Institución'
                                    ? <><span className="material-symbols-outlined text-[16px] align-[-3px] mr-1">school</span>Institución</>
                                    : <><span className="material-symbols-outlined text-[16px] align-[-3px] mr-1">group</span>Particulares</>
                                }
                            </button>
                        ))}
                    </div>

                    {/* ── Sub-formulario: Institución ── */}
                    {tipoVisitante === 'Institución' && (
                        <div className="space-y-4">
                            {institucion_id && institucionSeleccionada ? (
                                <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg">
                                    <div>
                                        <p className="font-bold text-on-surface">{institucionSeleccionada.nombre}</p>
                                        {institucionSeleccionada.localidad && <p className="text-sm text-on-surface-variant">{institucionSeleccionada.localidad}, {institucionSeleccionada.provincia}</p>}
                                    </div>
                                    <button type="button" onClick={() => { setInstitucionId(''); setBusquedaInstitucion(''); }} className="text-xs text-primary hover:underline">Cambiar</button>
                                </div>
                            ) : (
                                <div className="flex gap-3 relative">
                                    <div className="flex-1 relative">
                                        <input
                                            type="text"
                                            className={inp}
                                            placeholder="Escribe el nombre, localidad o provincia..."
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
                                                            className="w-full text-left px-4 py-2 hover:bg-primary/10 border-b border-outline-variant/50 last:border-b-0 transition-colors"
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

                            <div>
                                <label className="text-xs font-bold uppercase text-outline">Nivel Educativo *</label>
                                <select required className={inp} value={nivelEducativo} onChange={e => setNivelEducativo(e.target.value)}>
                                    {NIVELES_EDUCATIVOS.map(n => <option key={n} value={n}>{n}</option>)}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* ── Sub-formulario: Particulares ── */}
                    {tipoVisitante === 'Particulares' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="text-xs font-bold uppercase text-outline">Nombre del Grupo *</label>
                                    <input required className={inp} placeholder="Ej: Familia García" value={particulares.nombre} onChange={e => setParticulares({ ...particulares, nombre: e.target.value })} />
                                </div>

                                {/* Tipo de grupo */}
                                <div className="md:col-span-2">
                                    <label className="text-xs font-bold uppercase text-outline mb-2 block">Tipo de Grupo *</label>
                                    <div className="flex gap-3">
                                        <label className={cn(
                                            'flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer text-sm font-medium transition-all',
                                            particulares.tipoMenores
                                                ? 'border-primary bg-primary/5 text-primary'
                                                : 'border-outline-variant text-on-surface-variant hover:border-primary/40'
                                        )}>
                                            <input type="checkbox" checked={particulares.tipoMenores} onChange={() => setParticulares({ ...particulares, tipoMenores: !particulares.tipoMenores })} className="hidden" />
                                            <span className="material-symbols-outlined text-[18px]">child_care</span>
                                            Menores
                                        </label>
                                        <label className={cn(
                                            'flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer text-sm font-medium transition-all',
                                            particulares.tipoAdultos
                                                ? 'border-primary bg-primary/5 text-primary'
                                                : 'border-outline-variant text-on-surface-variant hover:border-primary/40'
                                        )}>
                                            <input type="checkbox" checked={particulares.tipoAdultos} onChange={() => setParticulares({ ...particulares, tipoAdultos: !particulares.tipoAdultos })} className="hidden" />
                                            <span className="material-symbols-outlined text-[18px]">person</span>
                                            Adultos
                                        </label>
                                        {particulares.tipoMenores && particulares.tipoAdultos && (
                                            <span className="flex items-center gap-1 px-3 py-2 rounded-lg bg-secondary/10 border border-secondary/30 text-secondary text-sm font-bold">
                                                <span className="material-symbols-outlined text-[16px]">people</span>
                                                Mixto
                                            </span>
                                        )}
                                    </div>
                                    {!particulares.tipoMenores && !particulares.tipoAdultos && (
                                        <p className="text-xs text-error mt-1">Seleccioná al menos un tipo de grupo</p>
                                    )}
                                </div>

                                <div>
                                    <label className="text-xs font-bold uppercase text-outline">Teléfono de Contacto *</label>
                                    <input required className={inp} placeholder="0343-4000000" value={particulares.telefono} onChange={e => setParticulares({ ...particulares, telefono: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase text-outline">Email *</label>
                                    <input required type="email" className={inp} placeholder="contacto@mail.com" value={particulares.email} onChange={e => setParticulares({ ...particulares, email: e.target.value })} />
                                </div>
                                <div className="md:col-span-2">
                                    <UbicacionSelector
                                        value={{ localidad: particulares.localidad, provincia: particulares.provincia, pais: particulares.pais }}
                                        onChange={({ localidad, provincia, pais }) =>
                                            setParticulares({ ...particulares, localidad, provincia, pais })
                                        }
                                        required
                                        inputClassName="h-10 text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </section>

                {/* ── SECCIÓN 2.5: OBSERVACIONES ── */}
                <section className={sectionCls}>
                    <h3 className="font-h3 flex items-center gap-2">
                        <span className="material-symbols-outlined">notes</span> Observaciones <span className="text-outline font-normal text-sm">(opcional)</span>
                    </h3>
                    <textarea
                        className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-white outline-none focus:border-primary transition-all text-sm resize-none"
                        rows={3}
                        placeholder="Ej: Vienen con padres acompañantes, necesitan espacio para silla de ruedas..."
                        value={observaciones}
                        onChange={e => setObservaciones(e.target.value)}
                    />
                </section>

                {/* ── SECCIÓN 3: TURNO Y CANTIDAD ── */}
                <section className={sectionCls}>
                    <h3 className="font-h3 flex items-center gap-2">
                        <span className="material-symbols-outlined">event_available</span> 3. Turno y Cantidad
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="text-xs font-bold uppercase text-outline">Fecha *</label>
                            <input type="date" required className={inp} value={visita.fecha} onChange={e => setVisita({ ...visita, fecha: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-outline">Hora de Inicio *</label>
                            <select required className={inp} value={visita.hora_inicio} onChange={e => setVisita({ ...visita, hora_inicio: e.target.value })}>
                                <option value="">Seleccione hora</option>
                                {horarios.map(h => <option key={h} value={h}>{h}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase text-outline">Tipo de Visita *</label>
                            <select required className={inp} value={visita.tipo} onChange={e => setVisita({ ...visita, tipo: e.target.value })}>
                                {TIPOS_VISITA.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase text-outline">Personas *</label>
                            <input type="number" required min="1" className={inp} value={visita.cantidad_personas} onChange={e => setVisita({ ...visita, cantidad_personas: e.target.value })} />
                        </div>

                        <div className="flex flex-col gap-3 pt-2">
                            <label className={cn(
                                'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all',
                                tipoVisitante === 'Particulares'
                                    ? 'border-outline-variant/50 bg-surface-container-low text-on-surface-variant/40 cursor-not-allowed opacity-60'
                                    : visita.tiene_cruce_tunel
                                        ? 'border-amber-400 bg-amber-50 text-amber-700 cursor-pointer'
                                        : 'border-outline-variant text-on-surface-variant cursor-pointer'
                            )}>
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 accent-amber-500"
                                    checked={visita.tiene_cruce_tunel}
                                    disabled={tipoVisitante === 'Particulares'}
                                    onChange={e => setVisita({ ...visita, tiene_cruce_tunel: e.target.checked })}
                                />
                                <span className="material-symbols-outlined text-[18px]">swap_horiz</span>
                                Realiza cruce del túnel
                            </label>
                            <label className={cn('flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm font-medium transition-all', visita.tiene_discapacidad ? 'border-secondary bg-secondary/5 text-secondary' : 'border-outline-variant text-on-surface-variant')}>
                                <input type="checkbox" className="w-4 h-4 accent-secondary" checked={visita.tiene_discapacidad} onChange={e => setVisita({ ...visita, tiene_discapacidad: e.target.checked })} />
                                <span className="material-symbols-outlined text-[18px]">accessible_forward</span>
                                Requiere accesibilidad
                            </label>
                        </div>

                        {visita.tiene_discapacidad && (
                            <div className="md:col-span-4">
                                <label className="text-xs font-bold uppercase text-outline">Detalle de accesibilidad *</label>
                                <input
                                    required
                                    className={inp}
                                    placeholder="Ej: 2 personas en silla de ruedas"
                                    value={visita.discapacidad_detalle}
                                    onChange={e => setVisita({ ...visita, discapacidad_detalle: e.target.value })}
                                />
                            </div>
                        )}
                    </div>
                </section>

                <div className="flex justify-end gap-4 pt-2">
                    <Button variant="outline" type="button" onClick={() => navigate(-1)}>Cancelar</Button>
                    <Button variant="primary" type="submit">
                        <span className="material-symbols-outlined text-[18px]">fact_check</span>
                        Revisar y Agendar
                    </Button>
                </div>
            </form>
        </>
    );
};