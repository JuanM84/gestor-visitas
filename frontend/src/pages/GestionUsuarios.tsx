import { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { cn } from '../utils/cn';

export const GestionUsuarios = () => {
    const [usuarios, setUsuarios] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorLista, setErrorLista] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        nombre: '',
        email: '',
        password: '',
        rol: 'Guía'
    });
    const [creando, setCreando] = useState(false);
    const [mensajeForm, setMensajeForm] = useState({ tipo: '', texto: '' });

    const token = localStorage.getItem('token');
    const inputStyles = "w-full h-11 px-4 rounded-lg border border-outline-variant bg-surface-bright text-on-background focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none transition-all";

    const fetchUsuarios = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/usuarios`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Error al cargar la lista de usuarios');
            const data = await res.json();
            setUsuarios(data);
        } catch (err: any) {
            setErrorLista(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsuarios();
    }, []);

    const handleCrearUsuario = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreando(true);
        setMensajeForm({ tipo: '', texto: '' });

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/usuarios`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Error al crear usuario');

            setMensajeForm({ tipo: 'exito', texto: 'Usuario creado correctamente.' });
            setFormData({ nombre: '', email: '', password: '', rol: 'Guía' }); // Limpiamos el form
            fetchUsuarios(); // Recargamos la tabla

        } catch (err: any) {
            setMensajeForm({ tipo: 'error', texto: err.message });
        } finally {
            setCreando(false);
            setTimeout(() => setMensajeForm({ tipo: '', texto: '' }), 4000);
        }
    };

    return (
        <div className="flex flex-col max-w-[1200px] w-full mx-auto">
            <div className="mb-lg">
                <h1 className="font-h1 text-h1 text-on-surface">Gestión de Usuarios</h1>
                <p className="font-body-md text-on-surface-variant mt-2">Administre los accesos y roles del personal del túnel.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg items-start">

                {/* COLUMNA IZQUIERDA: Formulario de Alta */}
                <div className="lg:col-span-1 bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant">
                    <div className="flex items-center gap-2 mb-6 text-primary">
                        <span className="material-symbols-outlined">person_add</span>
                        <h2 className="font-h3 text-h3">Nuevo Usuario</h2>
                    </div>

                    <form onSubmit={handleCrearUsuario} className="flex flex-col gap-4">
                        <div>
                            <label className="font-label-sm block mb-1">Nombre Completo</label>
                            <input type="text" required value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} className={inputStyles} placeholder="Ej: Juan Pérez" />
                        </div>

                        <div>
                            <label className="font-label-sm block mb-1">Correo Electrónico</label>
                            <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={inputStyles} placeholder="correo@ejemplo.com" />
                        </div>

                        <div>
                            <label className="font-label-sm block mb-1">Contraseña Provisoria</label>
                            <input type="password" required value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className={inputStyles} placeholder="Mínimo 6 caracteres" minLength={6} />
                        </div>

                        <div>
                            <label className="font-label-sm block mb-1">Rol en el Sistema</label>
                            <select value={formData.rol} onChange={(e) => setFormData({ ...formData, rol: e.target.value })} className={cn(inputStyles, "cursor-pointer")}>
                                <option value="Guía">Guía Operativo</option>
                                <option value="Admin">Administrador</option>
                            </select>
                        </div>

                        {mensajeForm.texto && (
                            <div className={`p-3 rounded-lg text-sm font-medium ${mensajeForm.tipo === 'exito' ? 'bg-[#e6f4ea] text-[#137333]' : 'bg-error-container text-on-error-container'}`}>
                                {mensajeForm.texto}
                            </div>
                        )}

                        <Button variant="primary" type="submit" disabled={creando} className="w-full mt-2">
                            {creando ? 'Creando...' : 'Crear Usuario'}
                        </Button>
                    </form>
                </div>

                {/* COLUMNA DERECHA: Tabla de Usuarios */}
                <div className="lg:col-span-2 bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant">
                    <div className="flex items-center gap-2 mb-6 text-primary">
                        <span className="material-symbols-outlined">badge</span>
                        <h2 className="font-h3 text-h3">Personal Registrado</h2>
                    </div>

                    <div className="rounded-xl border border-surface-container-highest overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-surface-container-low border-b border-surface-container-highest">
                                <tr>
                                    <th className="p-4 font-label-md">Nombre y Correo</th>
                                    <th className="p-4 font-label-md">Rol</th>
                                    <th className="p-4 font-label-md">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-surface-container-highest">
                                {loading ? (
                                    <tr><td colSpan={3} className="p-8 text-center">Cargando usuarios...</td></tr>
                                ) : errorLista ? (
                                    <tr><td colSpan={3} className="p-8 text-center text-error">{errorLista}</td></tr>
                                ) : usuarios.length === 0 ? (
                                    <tr><td colSpan={3} className="p-8 text-center text-on-surface-variant">No hay usuarios registrados.</td></tr>
                                ) : (
                                    usuarios.map((usr) => (
                                        <tr key={usr.id} className="hover:bg-surface-bright transition-colors">
                                            <td className="p-4">
                                                <div className="font-semibold">{usr.nombre}</div>
                                                <div className="text-xs text-on-surface-variant">{usr.email}</div>
                                            </td>
                                            <td className="p-4">
                                                <span className={cn(
                                                    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                                                    usr.rol === 'Admin' ? "bg-primary-container text-on-primary-container" : "bg-surface-variant text-on-surface-variant"
                                                )}>
                                                    {usr.rol}
                                                </span>
                                            </td>
                                            <td className="p-4 text-sm">
                                                {usr.activo ? (
                                                    <span className="text-primary font-medium">Activo</span>
                                                ) : (
                                                    <span className="text-error font-medium">Inactivo</span>
                                                )}
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