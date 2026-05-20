import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { cn } from '../utils/cn';
import { TIPOS_VISITA } from '../utils/visitaTypes';
import { ESTADOS_VISITA, BADGE_ESTADO } from '../utils/visitaTypes';
import { useAuth } from '../context/AuthContext';

export const EditarVisita = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token } = useAuth();

    // 1. Ampliamos el estado para incluir los nuevos campos
    const [formData, setFormData] = useState({
        fecha: '',
        hora_inicio: '',
        cantidad_personas: 0,
        estado: '',
        tipo: 'Complejo',
        tiene_cruce_tunel: false,
        tiene_discapacidad: false,
        discapacidad_detalle: ''
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchVisita = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/visitas/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('No se pudo cargar la visita');

                const data = await response.json();

                // 2. Pre-llenamos el formulario asegurando los formatos correctos
                setFormData({
                    fecha: data.fecha.split('T')[0],
                    hora_inicio: data.hora_inicio.slice(0, 5), // Cortamos a HH:MM para el input time
                    cantidad_personas: data.cantidad_personas,
                    estado: data.estado,
                    tipo: data.tipo || 'Complejo',
                    tiene_cruce_tunel: data.tiene_cruce_tunel || false,
                    tiene_discapacidad: data.tiene_discapacidad || false,
                    discapacidad_detalle: data.discapacidad_detalle || ''
                });
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchVisita();
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        // Si desmarcan accesibilidad, limpiamos el detalle por las dudas
        const dataToSend = {
            ...formData,
            discapacidad_detalle: formData.tiene_discapacidad ? formData.discapacidad_detalle : ''
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

    const inputStyles = "w-full h-11 px-4 rounded-lg border border-outline-variant bg-surface-bright text-on-background focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none transition-all";

    if (loading) return <div className="p-8 text-center animate-pulse">Cargando datos...</div>;

    return (
        <div className="flex flex-col max-w-[800px] w-full mx-auto bg-surface-container-lowest p-8 rounded-3xl shadow-sm border border-outline-variant">
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-surface-container-low text-on-surface-variant transition-colors">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <div>
                    <h1 className="font-h2 text-h2 text-on-surface">Modificar Visita</h1>
                    <p className="font-body-md text-on-surface-variant">Actualice los datos de agenda y requerimientos.</p>
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-error-container/20 border border-error/50 rounded-lg text-error text-sm font-medium">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">

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

                {/* 2. Requerimientos Especiales */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-surface-container-low p-6 rounded-2xl border border-surface-container">
                    <h3 className="md:col-span-2 font-bold text-primary flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined text-[20px]">tune</span>
                        Requerimientos Especiales
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
    );
};