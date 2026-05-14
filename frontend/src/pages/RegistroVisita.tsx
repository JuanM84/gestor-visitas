import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { TIPOS_VISITA } from '../utils/visitaTypes';

export const RegistroVisita = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = localStorage.getItem('token');
    const [gestores, setGestores] = useState<any[]>([]);
    const [errorSubmit, setErrorSubmit] = useState<string | null>(null);

    const fechaInicial = searchParams.get('fecha') || new Date().toISOString().split('T')[0];

    const [form, setForm] = useState({
        gestor_id: '',
        nuevoGestor: { nombre: '', tipo: 'Otro', telefono: '', email: '', localidad: '', provincia: '', pais: '' },
        grupo: { nombre: '', tipo: 'Escolar', nivel_educativo: 'Primario', descripcion: '' },
        visita: {
            fecha: fechaInicial,
            hora_inicio: '',
            tipo: 'Complejo',
            tiene_cruce_tunel: false,
            cantidad_personas: '',
            tiene_discapacidad: false,
            discapacidad_detalle: ''
        }
    });

    // Generamos los slots de 30 min (08:00 a 18:00)
    const generarHorarios = () => {
        const slots = [];
        for (let h = 8; h <= 18; h++) {
            const hora = h < 10 ? `0${h}` : `${h}`;
            slots.push(`${hora}:00`);
            if (h < 18) slots.push(`${hora}:30`);
        }
        return slots;
    };

    useEffect(() => {
        // Cargamos los gestores para el buscador/select
        fetch('http://localhost:3000/api/gestores', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => setGestores(data));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorSubmit(null);
        try {
            const res = await fetch('http://localhost:3000/api/visitas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(form)
            });
            if (res.ok) {
                navigate('/dashboard');
            } else {
                const data = await res.json();
                setErrorSubmit(data.error || 'Error al registrar la visita.');
            }
        } catch (error) {
            setErrorSubmit('Error de conexión con el servidor.');
        }
    };

    const inputClass = "w-full h-10 px-3 rounded-lg border border-outline-variant bg-white outline-none focus:border-primary transition-all";

    return (
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-6 space-y-8">
            <h1 className="text-h2 font-h2">Registrar Nueva Visita</h1>

            {/* Error de submit */}
            {errorSubmit && (
                <div className="p-4 bg-error-container/20 border border-error/50 rounded-lg text-error text-sm font-medium flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">error</span>
                    {errorSubmit}
                </div>
            )}

            {/* SECCIÓN 1: GESTOR (CU-003: Asignar o Crear) */}
            <section className="bg-surface-container-low p-6 rounded-xl border border-surface-container">
                <h3 className="font-h3 mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined">domain</span> 1. Institución / Gestor
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <label className="text-xs font-bold text-outline">Seleccionar o Crear</label>
                        <select
                            className={inputClass}
                            value={form.gestor_id}
                            onChange={(e) => setForm({ ...form, gestor_id: e.target.value })}
                        >
                            <option value="">-- Registrar Nuevo Gestor --</option>
                            {gestores.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
                        </select>
                    </div>

                    {/* Si es nuevo gestor, mostramos todos los campos del modelo  */}
                    {form.gestor_id === '' && (
                        <>
                            <div className="md:col-span-2">
                                <input placeholder="Nombre Institución" type="text" required className={inputClass}
                                    onChange={(e) => setForm({ ...form, nuevoGestor: { ...form.nuevoGestor, nombre: e.target.value } })} />
                            </div>
                            <select className={inputClass} onChange={(e) => setForm({ ...form, nuevoGestor: { ...form.nuevoGestor, tipo: e.target.value } })}>
                                <option>Institución Educativa</option>
                                <option>Agencia de Turismo</option>
                                <option>Otro</option>
                            </select>
                            <input placeholder="Teléfono" type="text" className={inputClass}
                                onChange={(e) => setForm({ ...form, nuevoGestor: { ...form.nuevoGestor, telefono: e.target.value } })} />
                            <input placeholder="Email" type="email" className={inputClass}
                                onChange={(e) => setForm({ ...form, nuevoGestor: { ...form.nuevoGestor, email: e.target.value } })} />
                            <input placeholder="Localidad" type="text" className={inputClass}
                                onChange={(e) => setForm({ ...form, nuevoGestor: { ...form.nuevoGestor, localidad: e.target.value } })} />
                            <input placeholder="Provincia" type="text" className={inputClass}
                                onChange={(e) => setForm({ ...form, nuevoGestor: { ...form.nuevoGestor, provincia: e.target.value } })} />
                            <input placeholder="País" type="text" className={inputClass}
                                onChange={(e) => setForm({ ...form, nuevoGestor: { ...form.nuevoGestor, pais: e.target.value } })} />
                        </>
                    )}
                </div>
            </section>

            {/* SECCIÓN 2: GRUPO */}
            <section className="bg-surface-container-low p-6 rounded-xl border border-surface-container">
                <h3 className="font-h3 mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined">groups</span> 2. Datos del Grupo
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                        <label className="text-xs font-bold uppercase text-outline">Nombre del Grupo/Grado</label>
                        <input
                            type="text" required className={inputClass}
                            value={form.grupo.nombre}
                            onChange={(e) => setForm({ ...form, grupo: { ...form.grupo, nombre: e.target.value } })}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase text-outline">Nivel Educativo</label>
                        <select
                            className={inputClass}
                            value={form.grupo.nivel_educativo}
                            onChange={(e) => setForm({ ...form, grupo: { ...form.grupo, nivel_educativo: e.target.value } })}
                        >
                            <option>Primario</option><option>Secundario</option><option>Terciario/Univ.</option><option>Otro</option>
                        </select>
                    </div>
                    <div className="md:col-span-3 mt-2">
                        <label className="text-xs font-bold uppercase text-outline">Descripción / Observaciones</label>
                        <input
                            type="text" className={inputClass} placeholder="Ej: Vienen con padres acompañantes..."
                            value={form.grupo.descripcion}
                            onChange={(e) => setForm({ ...form, grupo: { ...form.grupo, descripcion: e.target.value } })}
                        />
                    </div>
                </div>
            </section>

            {/* SECCIÓN 3: DETALLES DE LA VISITA */}
            <section className="bg-surface-container-low p-6 rounded-xl border border-surface-container">
                <h3 className="font-h3 mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined">event_available</span> 3. Turno y Cantidad
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="text-xs font-bold uppercase text-outline">Fecha</label>
                        <input type="date" required className={inputClass} value={form.visita.fecha}
                            onChange={(e) => setForm({ ...form, visita: { ...form.visita, fecha: e.target.value } })} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-outline">Hora de Inicio</label>
                        <select required className={inputClass} value={form.visita.hora_inicio}
                            onChange={(e) => setForm({ ...form, visita: { ...form.visita, hora_inicio: e.target.value } })}>
                            <option value="">Seleccione hora</option>
                            {generarHorarios().map(hora => <option key={hora} value={hora}>{hora}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase text-outline">Tipo de Visita</label>
                        <select required className={inputClass} value={form.visita.tipo}
                            onChange={(e) => setForm({ ...form, visita: { ...form.visita, tipo: e.target.value } })}>
                            {TIPOS_VISITA.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase text-outline">Personas</label>
                        <input type="number" required className={inputClass}
                            value={form.visita.cantidad_personas}
                            onChange={(e) => setForm({ ...form, visita: { ...form.visita, cantidad_personas: e.target.value } })} />
                    </div>

                    <div className="flex flex-col gap-2 pt-4">
                        <div className="flex items-center gap-2">
                            <input type="checkbox" id="cruce" className="w-5 h-5" onChange={(e) => setForm({ ...form, visita: { ...form.visita, tiene_cruce_tunel: e.target.checked } })} />
                            <label htmlFor="cruce" className="text-sm font-medium">¿Tiene cruce?</label>
                        </div>
                        {/* CHECKBOX DE DISCAPACIDAD */}
                        <div className="flex items-center gap-2">
                            <input type="checkbox" id="discap" className="w-5 h-5" checked={form.visita.tiene_discapacidad}
                                onChange={(e) => setForm({ ...form, visita: { ...form.visita, tiene_discapacidad: e.target.checked } })} />
                            <label htmlFor="discap" className="text-sm font-medium text-secondary">¿Accesibilidad req.?</label>
                        </div>
                    </div>

                    {/* INPUT CONDICIONAL PARA DETALLE */}
                    {form.visita.tiene_discapacidad && (
                        <div className="md:col-span-4 mt-2">
                            <input placeholder="Describa el requerimiento (ej: 2 personas en silla de ruedas)" className={inputClass}
                                value={form.visita.discapacidad_detalle}
                                onChange={(e) => setForm({ ...form, visita: { ...form.visita, discapacidad_detalle: e.target.value } })} />
                        </div>
                    )}
                </div>
            </section>

            <div className="flex justify-end gap-4 pt-4">
                <Button variant="outline" type="button" onClick={() => navigate(-1)}>Cancelar</Button>
                <Button variant="primary" type="submit">Agendar Visita</Button>
            </div>
        </form>
    );
};