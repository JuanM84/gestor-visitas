import { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { cn } from '../utils/cn';
import { useAuth } from '../context/AuthContext';

// ── Modal genérico ──────────────────────────────────────────────────────────
const Modal = ({ titulo, onClose, children }: { titulo: string; onClose: () => void; children: React.ReactNode }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
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

export const GestionUsuarios = () => {
    const [usuarios, setUsuarios] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorLista, setErrorLista] = useState<string | null>(null);
    const [mensajeGlobal, setMensajeGlobal] = useState({ tipo: '', texto: '' });

    // Form nuevo usuario
    const [formData, setFormData] = useState({ nombre: '', email: '', password: '', rol: 'Guía' });
    const [confirmPassword, setConfirmPassword] = useState('');
    const [creando, setCreando] = useState(false);
    const [mensajeForm, setMensajeForm] = useState({ tipo: '', texto: '' });

    // Modal editar usuario
    const [modalEditar, setModalEditar] = useState<any | null>(null);
    const [editForm, setEditForm] = useState({ nombre: '', email: '', telefono: '', rol: 'Guía' });
    const [guardandoEdit, setGuardandoEdit] = useState(false);
    const [mensajeEdit, setMensajeEdit] = useState({ tipo: '', texto: '' });

    const { token } = useAuth();
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

    useEffect(() => { fetchUsuarios(); }, []);

    // ── Crear usuario ──────────────────────────────────────────────────────
    const handleCrearUsuario = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreando(true);
        setMensajeForm({ tipo: '', texto: '' });

        if (formData.password !== confirmPassword) {
            setMensajeForm({ tipo: 'error', texto: 'Las contraseñas no coinciden.' });
            setCreando(false);
            return;
        }

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/usuarios`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al crear usuario');

            setMensajeForm({ tipo: 'exito', texto: '✓ Usuario creado correctamente.' });
            setFormData({ nombre: '', email: '', password: '', rol: 'Guía' });
            setConfirmPassword('');
            fetchUsuarios();
        } catch (err: any) {
            setMensajeForm({ tipo: 'error', texto: err.message });
        } finally {
            setCreando(false);
            setTimeout(() => setMensajeForm({ tipo: '', texto: '' }), 4000);
        }
    };

    // ── Desactivar usuario (U-8) ───────────────────────────────────────────
    const handleDesactivar = async (usr: any) => {
        if (!confirm(`¿Desactivar al usuario "${usr.nombre}"? No podrá iniciar sesión hasta que sea reactivado.`)) return;

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/usuarios/${usr.id}/desactivar`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al desactivar usuario');
            setMensajeGlobal({ tipo: 'exito', texto: `✓ ${data.mensaje}` });
            fetchUsuarios();
        } catch (err: any) {
            setMensajeGlobal({ tipo: 'error', texto: err.message });
        } finally {
            setTimeout(() => setMensajeGlobal({ tipo: '', texto: '' }), 5000);
        }
    };

    // ── Reactivar usuario ──────────────────────────────────────────────────
    const handleReactivar = async (usr: any) => {
        if (!confirm(`¿Reactivar al usuario "${usr.nombre}"? Podrá volver a iniciar sesión.`)) return;

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/usuarios/${usr.id}/reactivar`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al reactivar usuario');
            setMensajeGlobal({ tipo: 'exito', texto: `✓ ${data.mensaje}` });
            fetchUsuarios();
        } catch (err: any) {
            setMensajeGlobal({ tipo: 'error', texto: err.message });
        } finally {
            setTimeout(() => setMensajeGlobal({ tipo: '', texto: '' }), 5000);
        }
    };

    // ── Abrir modal de edición ─────────────────────────────────────────────
    const abrirEditar = async (usr: any) => {
        setMensajeEdit({ tipo: '', texto: '' });
        // Traer datos completos del usuario (incluye teléfono)
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/usuarios/${usr.id}/perfil`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = res.ok ? await res.json() : usr;
            setEditForm({
                nombre: data.nombre || '',
                email: data.email || '',
                telefono: data.telefono || '',
                rol: data.rol || 'Guía',
            });
        } catch {
            setEditForm({ nombre: usr.nombre || '', email: usr.email || '', telefono: '', rol: usr.rol || 'Guía' });
        }
        setModalEditar(usr);
    };

    const cerrarEditar = () => {
        setModalEditar(null);
        setEditForm({ nombre: '', email: '', telefono: '', rol: 'Guía' });
        setMensajeEdit({ tipo: '', texto: '' });
    };

    // ── Guardar edición de usuario ─────────────────────────────────────────
    const handleGuardarEdicion = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editForm.nombre.trim() || !editForm.email.trim()) {
            setMensajeEdit({ tipo: 'error', texto: 'El nombre y el correo son obligatorios.' });
            return;
        }
        setGuardandoEdit(true);
        setMensajeEdit({ tipo: '', texto: '' });
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/usuarios/${modalEditar.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    nombre: editForm.nombre.trim(),
                    email: editForm.email.trim(),
                    telefono: editForm.telefono.trim() || null,
                    rol: editForm.rol,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al actualizar el usuario');
            setMensajeEdit({ tipo: 'exito', texto: '✓ Usuario actualizado correctamente.' });
            fetchUsuarios();
            setTimeout(() => cerrarEditar(), 1500);
        } catch (err: any) {
            setMensajeEdit({ tipo: 'error', texto: err.message });
        } finally {
            setGuardandoEdit(false);
        }
    };

    const bannerCls = (tipo: string) =>
        `flex items-center gap-2 p-3 rounded-lg text-sm font-medium ${tipo === 'exito' ? 'bg-[#e6f4ea] text-[#137333]' : 'bg-error-container text-on-error-container'}`;

    return (
        <div className="flex flex-col max-w-[1200px] w-full mx-auto">
            <div className="mb-lg">
                <h1 className="font-h1 text-h1 text-on-surface">Gestión de Usuarios</h1>
                <p className="font-body-md text-on-surface-variant mt-2">Administre los accesos y roles del personal del túnel.</p>
            </div>

            {/* Mensaje global */}
            {mensajeGlobal.texto && (
                <div className={`${bannerCls(mensajeGlobal.tipo)} mb-4`}>
                    <span className="material-symbols-outlined text-[16px] shrink-0">
                        {mensajeGlobal.tipo === 'exito' ? 'check_circle' : 'error'}
                    </span>
                    {mensajeGlobal.texto}
                </div>
            )}

            {/* ── Modal: Editar usuario ── */}
            {modalEditar && (
                <Modal titulo={`Editar usuario — ${modalEditar.nombre}`} onClose={cerrarEditar}>
                    <form onSubmit={handleGuardarEdicion} className="flex flex-col gap-4">
                        <div>
                            <label className="font-label-sm block mb-1">Nombre completo *</label>
                            <input
                                id="input-edit-nombre"
                                type="text"
                                required
                                value={editForm.nombre}
                                onChange={e => setEditForm({ ...editForm, nombre: e.target.value })}
                                className={inputStyles}
                                placeholder="Nombre completo"
                            />
                        </div>
                        <div>
                            <label className="font-label-sm block mb-1">Correo electrónico *</label>
                            <input
                                id="input-edit-email"
                                type="email"
                                required
                                value={editForm.email}
                                onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                                className={inputStyles}
                                placeholder="correo@ejemplo.com"
                            />
                        </div>
                        <div>
                            <label className="font-label-sm block mb-1">Teléfono</label>
                            <input
                                id="input-edit-telefono"
                                type="tel"
                                value={editForm.telefono}
                                onChange={e => setEditForm({ ...editForm, telefono: e.target.value })}
                                className={inputStyles}
                                placeholder="+54 343 xxx-xxxx (opcional)"
                            />
                        </div>
                        <div>
                            <label className="font-label-sm block mb-1">Rol en el sistema *</label>
                            <select
                                id="select-edit-rol"
                                value={editForm.rol}
                                onChange={e => setEditForm({ ...editForm, rol: e.target.value })}
                                className={cn(inputStyles, "cursor-pointer")}
                            >
                                <option value="Guía">Guía Operativo</option>
                                <option value="Admin">Administrador</option>
                            </select>
                        </div>

                        <p className="text-xs text-on-surface-variant -mt-1">
                            La contraseña no se modifica desde aquí. El usuario puede cambiarla desde su perfil.
                        </p>

                        {mensajeEdit.texto && (
                            <div className={bannerCls(mensajeEdit.tipo)}>
                                <span className="material-symbols-outlined text-[16px] shrink-0">
                                    {mensajeEdit.tipo === 'exito' ? 'check_circle' : 'error'}
                                </span>
                                {mensajeEdit.texto}
                            </div>
                        )}

                        <div className="flex gap-3 justify-end pt-2">
                            <Button variant="outline" type="button" onClick={cerrarEditar}>Cancelar</Button>
                            <Button variant="primary" type="submit" disabled={guardandoEdit}>
                                {guardandoEdit ? 'Guardando...' : 'Guardar cambios'}
                            </Button>
                        </div>
                    </form>
                </Modal>
            )}

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
                            <input
                                type="password" required minLength={8}
                                pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}"
                                title="Mínimo 8 caracteres, una mayúscula, una minúscula y un número"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className={inputStyles} placeholder="Mínimo 8 caracteres"
                            />
                        </div>

                        <div>
                            <label className="font-label-sm block mb-1">Repetir Contraseña</label>
                            <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputStyles} placeholder="Repita la contraseña" />
                        </div>

                        <div>
                            <label className="font-label-sm block mb-1">Rol en el Sistema</label>
                            <select value={formData.rol} onChange={(e) => setFormData({ ...formData, rol: e.target.value })} className={cn(inputStyles, "cursor-pointer")}>
                                <option value="Guía">Guía Operativo</option>
                                <option value="Admin">Administrador</option>
                            </select>
                        </div>

                        {mensajeForm.texto && (
                            <div className={bannerCls(mensajeForm.tipo)}>
                                <span className="material-symbols-outlined text-[16px] shrink-0">
                                    {mensajeForm.tipo === 'exito' ? 'check_circle' : 'error'}
                                </span>
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
                                    <th className="p-4 font-label-md text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-surface-container-highest">
                                {loading ? (
                                    <tr><td colSpan={4} className="p-8 text-center">Cargando usuarios...</td></tr>
                                ) : errorLista ? (
                                    <tr><td colSpan={4} className="p-8 text-center text-error">{errorLista}</td></tr>
                                ) : usuarios.length === 0 ? (
                                    <tr><td colSpan={4} className="p-8 text-center text-on-surface-variant">No hay usuarios registrados.</td></tr>
                                ) : (
                                    usuarios.map((usr) => (
                                        <tr key={usr.id} className={cn("transition-colors", usr.activo ? "hover:bg-surface-bright" : "opacity-60 bg-surface-container-low/50")}>
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
                                                    <span className="inline-flex items-center gap-1 text-primary font-medium">
                                                        <span className="w-2 h-2 rounded-full bg-primary inline-block"></span> Activo
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-error font-medium">
                                                        <span className="w-2 h-2 rounded-full bg-error inline-block"></span> Inactivo
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex gap-1 justify-end">
                                                    {/* Editar datos del usuario */}
                                                    <button
                                                        id={`btn-editar-usuario-${usr.id}`}
                                                        onClick={() => abrirEditar(usr)}
                                                        title="Editar usuario"
                                                        className="p-2 hover:bg-secondary/10 rounded-lg text-secondary transition-colors"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">edit</span>
                                                    </button>

                                                    {/* Desactivar (solo si está activo) */}
                                                    {usr.activo && (
                                                        <button
                                                            id={`btn-desactivar-usuario-${usr.id}`}
                                                            onClick={() => handleDesactivar(usr)}
                                                            title="Desactivar usuario"
                                                            className="p-2 hover:bg-error-container rounded-lg text-error transition-colors"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">person_off</span>
                                                        </button>
                                                    )}

                                                    {/* Reactivar (solo si está inactivo) */}
                                                    {!usr.activo && (
                                                        <button
                                                            id={`btn-reactivar-usuario-${usr.id}`}
                                                            onClick={() => handleReactivar(usr)}
                                                            title="Reactivar usuario"
                                                            className="p-2 hover:bg-[#e6f4ea] rounded-lg text-[#137333] transition-colors"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">person_check</span>
                                                        </button>
                                                    )}
                                                </div>
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