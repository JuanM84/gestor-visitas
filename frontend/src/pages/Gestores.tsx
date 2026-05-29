import { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { cn } from '../utils/cn';
import { useAuth } from '../context/AuthContext';
import { UbicacionSelector } from '../components/ui/UbicacionSelector';

export const Gestores = () => {
    const [gestores, setGestores] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorLista, setErrorLista] = useState<string | null>(null);
    const [gestorSeleccionado, setGestorSeleccionado] = useState<any | null>(null);

    // Estado para el formulario
    const [formData, setFormData] = useState({
        nombre: '',
        tipo: 'Institución Educativa',
        telefono: '',
        email: '',
        localidad: '',
        provincia: '',
        pais: 'Argentina'
    });
    const [guardando, setGuardando] = useState(false);
    const [mensajeForm, setMensajeForm] = useState({ tipo: '', texto: '' });

    const { token } = useAuth();
    const inputStyles = "w-full h-11 px-4 rounded-lg border border-outline-variant bg-surface-bright text-on-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all";

    const fetchGestores = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/gestores`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Error al cargar el directorio');
            const data = await res.json();
            setGestores(data);
        } catch (err: any) {
            setErrorLista(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGestores();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setGuardando(true);
        setMensajeForm({ tipo: '', texto: '' });

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/gestores`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al guardar el gestor');

            setMensajeForm({ tipo: 'exito', texto: 'Gestor registrado correctamente.' });
            setFormData({ nombre: '', tipo: 'Institución Educativa', telefono: '', email: '', localidad: '', provincia: '', pais: 'Argentina' });
            fetchGestores();
        } catch (err: any) {
            setMensajeForm({ tipo: 'error', texto: err.message });
        } finally {
            setGuardando(false);
            setTimeout(() => setMensajeForm({ tipo: '', texto: '' }), 4000);
        }
    };

    return (
        <div className="flex flex-col max-w-[1200px] w-full mx-auto">

            {/* ── Modal de datos del gestor ── */}
            {gestorSeleccionado && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        {/* Header */}
                        <div className="bg-primary px-6 py-5 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-white text-[22px]">contact_page</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-white text-base leading-tight truncate">{gestorSeleccionado.nombre}</h3>
                                <p className="text-white/70 text-xs mt-0.5">{gestorSeleccionado.tipo || 'Gestor'}</p>
                            </div>
                            <button
                                onClick={() => setGestorSeleccionado(null)}
                                className="p-1 rounded-full hover:bg-white/20 text-white transition-colors shrink-0"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        {/* Cuerpo */}
                        <div className="p-6 space-y-4">
                            {[
                                { icon: 'badge', label: 'Nombre', value: gestorSeleccionado.nombre },
                                { icon: 'category', label: 'Tipo', value: gestorSeleccionado.tipo },
                                { icon: 'domain', label: 'Empresa / Institución', value: gestorSeleccionado.empresa_institucion },
                                { icon: 'call', label: 'Teléfono', value: gestorSeleccionado.telefono },
                                { icon: 'mail', label: 'Email', value: gestorSeleccionado.email },
                                { icon: 'location_on', label: 'Localidad', value: gestorSeleccionado.localidad },
                                { icon: 'map', label: 'Provincia', value: gestorSeleccionado.provincia },
                                { icon: 'public', label: 'País', value: gestorSeleccionado.pais },
                            ].map(({ icon, label, value }) =>
                                value ? (
                                    <div key={label} className="flex items-start gap-3">
                                        <span className="material-symbols-outlined text-[18px] text-primary mt-0.5 shrink-0">{icon}</span>
                                        <div>
                                            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">{label}</p>
                                            <p className="text-sm text-on-surface font-medium">{value}</p>
                                        </div>
                                    </div>
                                ) : null
                            )}
                        </div>

                        <div className="px-6 pb-5">
                            <Button variant="outline" className="w-full" onClick={() => setGestorSeleccionado(null)}>
                                Cerrar
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <div className="mb-lg">
                <h1 className="font-h1 text-h1 text-on-surface">Directorio de Gestores</h1>
                <p className="font-body-md text-on-surface-variant mt-2">Administre las instituciones, escuelas y agencias que realizan visitas al túnel.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg items-start">

                {/* COLUMNA IZQUIERDA: Formulario de Alta */}
                <div className="lg:col-span-1 bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant">
                    <div className="flex items-center gap-2 mb-6 text-primary">
                        <span className="material-symbols-outlined">domain_add</span>
                        <h2 className="font-h3 text-h3">Nuevo Gestor</h2>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div>
                            <label className="font-label-sm block mb-1">Nombre de Institución / Persona</label>
                            <input type="text" required value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} className={inputStyles} placeholder="Ej: Escuela Normal José de San Martín" />
                        </div>

                        <div>
                            <label className="font-label-sm block mb-1">Tipo de Gestor</label>
                            <select value={formData.tipo} onChange={(e) => setFormData({ ...formData, tipo: e.target.value })} className={cn(inputStyles, "cursor-pointer")}>
                                <option value="Institución Educativa">Institución Educativa</option>
                                <option value="Agencia de Turismo">Agencia de Turismo</option>
                                <option value="Club / Asociación">Club / Asociación</option>
                                <option value="Particular / Organismo Público">Particular / Organismo Público</option>
                            </select>
                        </div>

                        <div>
                            <label className="font-label-sm block mb-1">Teléfono de Contacto <span className="text-on-surface-variant font-normal">(Opcional)</span></label>
                            <input type="tel" value={formData.telefono} onChange={(e) => setFormData({ ...formData, telefono: e.target.value })} className={inputStyles} placeholder="Cod. Área + Número" />
                        </div>

                        <div>
                            <label className="font-label-sm block mb-1">Correo Electrónico <span className="text-on-surface-variant font-normal">(Opcional)</span></label>
                            <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={inputStyles} placeholder="contacto@institucion.edu.ar" />
                        </div>

                        <UbicacionSelector
                            value={{ localidad: formData.localidad, provincia: formData.provincia, pais: formData.pais }}
                            onChange={({ localidad, provincia, pais }) =>
                                setFormData({ ...formData, localidad, provincia, pais })
                            }
                        />

                        {mensajeForm.texto && (
                            <div className={`flex items-center gap-2 p-3 rounded-lg text-sm font-medium ${mensajeForm.tipo === 'exito' ? 'bg-[#e6f4ea] text-[#137333]' : 'bg-error-container text-on-error-container'}`}>
                                <span className="material-symbols-outlined text-[16px] shrink-0">
                                    {mensajeForm.tipo === 'exito' ? 'check_circle' : 'error'}
                                </span>
                                {mensajeForm.texto}
                            </div>
                        )}

                        <Button variant="primary" type="submit" disabled={guardando} className="w-full mt-2">
                            {guardando ? 'Guardando...' : 'Registrar Gestor'}
                        </Button>
                    </form>
                </div>

                {/* COLUMNA DERECHA: Tabla Directorio */}
                <div className="lg:col-span-2 bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant">
                    <div className="flex items-center gap-2 mb-6 text-primary">
                        <span className="material-symbols-outlined">contact_page</span>
                        <h2 className="font-h3 text-h3">Gestores Registrados</h2>
                    </div>

                    <div className="rounded-xl border border-surface-container-highest overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-surface-container-low border-b border-surface-container-highest">
                                <tr>
                                    <th className="p-4 font-label-md">Institución</th>
                                    <th className="p-4 font-label-md">Tipo</th>
                                    <th className="p-4 font-label-md">Ubicación</th>
                                    <th className="p-4 font-label-md">Contacto</th>
                                    <th className="p-4 font-label-md w-14"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-surface-container-highest">
                                {loading ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-outline">Cargando directorio...</td></tr>
                                ) : errorLista ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-error">{errorLista}</td></tr>
                                ) : gestores.length === 0 ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-on-surface-variant">No hay gestores registrados en el sistema.</td></tr>
                                ) : (
                                    gestores.map((gestor) => (
                                        <tr key={gestor.id} className="hover:bg-surface-bright transition-colors">
                                            <td className="p-4">
                                                <div className="font-semibold text-on-surface">{gestor.nombre}</div>
                                            </td>
                                            <td className="p-4">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-surface-variant text-on-surface-variant">
                                                    {gestor.tipo}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-sm text-on-surface-variant flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-[16px]">location_on</span>
                                                    {gestor.localidad ? `${gestor.localidad}${gestor.provincia ? `, ${gestor.provincia}` : ''}` : 'No especificada'}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-sm text-on-surface-variant flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-[16px]">call</span>
                                                    {gestor.telefono || 'Sin teléfono'}
                                                </div>
                                                {gestor.email && (
                                                    <div className="text-xs text-outline mt-0.5">{gestor.email}</div>
                                                )}
                                            </td>
                                            <td className="p-4 text-center">
                                                <button
                                                    onClick={() => setGestorSeleccionado(gestor)}
                                                    title="Ver datos completos"
                                                    className="p-2 hover:bg-primary/10 rounded-full text-primary transition-colors"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">info</span>
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