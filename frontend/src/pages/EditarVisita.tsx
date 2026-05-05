import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { cn } from '../utils/cn';

export const EditarVisita = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        fecha: '',
        hora_inicio: '',
        cantidad_personas: 0,
        estado: ''
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchVisita = async () => {
            const token = localStorage.getItem('token');
            try {
                const response = await fetch(`http://localhost:3000/api/visitas/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('No se pudo cargar la visita');

                const data = await response.json();
                // Pre-llenamos el formulario
                setFormData({
                    fecha: data.fecha.split('T')[0],
                    hora_inicio: data.hora_inicio,
                    cantidad_personas: data.cantidad_personas,
                    estado: data.estado
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
        const token = localStorage.getItem('token');

        try {
            const response = await fetch(`http://localhost:3000/api/visitas/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Error al modificar');
            }

            // Si es exitoso, volvemos al detalle o al listado
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
        <div className="flex flex-col max-w-[600px] w-full mx-auto bg-surface-container-lowest p-8 rounded-2xl shadow-sm border border-outline-variant">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-surface-container-low text-on-surface-variant">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h1 className="font-h2 text-h2 text-on-surface">Modificar Visita</h1>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-error-container/20 border border-error/50 rounded-lg text-error text-sm font-medium">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="font-label-sm block mb-1">Fecha</label>
                        <input
                            type="date"
                            required
                            value={formData.fecha}
                            onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                            className={inputStyles}
                        />
                    </div>
                    <div>
                        <label className="font-label-sm block mb-1">Hora de Inicio</label>
                        <input
                            type="time"
                            required
                            step="1800"
                            value={formData.hora_inicio}
                            onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })}
                            className={inputStyles}
                        />
                    </div>
                </div>

                <div>
                    <label className="font-label-sm block mb-1">Cantidad de Personas</label>
                    <input
                        type="number"
                        min="1"
                        required
                        value={formData.cantidad_personas}
                        onChange={(e) => setFormData({ ...formData, cantidad_personas: parseInt(e.target.value) })}
                        className={inputStyles}
                    />
                </div>

                <div>
                    <label className="font-label-sm block mb-1">Estado de la Visita</label>
                    <select
                        value={formData.estado}
                        onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                        className={cn(inputStyles, "cursor-pointer")}
                    >
                        <option value="Agendada">Agendada</option>
                        <option value="Confirmada">Confirmada</option>
                        <option value="Realizada">Realizada</option>
                        <option value="Cancelada">Cancelada</option>
                    </select>
                </div>

                <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-surface-container-highest">
                    <Button variant="outline" type="button" onClick={() => navigate(-1)}>
                        Cancelar
                    </Button>
                    <Button variant="primary" type="submit" disabled={saving}>
                        {saving ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                </div>
            </form>
        </div>
    );
};