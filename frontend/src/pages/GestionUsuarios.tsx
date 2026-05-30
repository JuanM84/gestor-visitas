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

    // Modal cambio de contraseña (A-9)
    const [modalPassword, setModalPassword] = useState<any | null>(null);
    const [pwForm, setPwForm] = useState({ actual: '', nueva: '', confirmar: '' });
    const [guardandoPw, setGuardandoPw] = useState(false);
    const [mensajePw, setMensajePw] = useState({ tipo: '', texto: '' });

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
        if (!confirm(`¿Desactivar al usuario "${usr.nombre}"? No podrá iniciar sesión hasta que sea reactivado manualmente.`)) return;

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

    // ── Cambiar contraseña (A-9) ───────────────────────────────────────────
    const handleCambiarPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setMensajePw({ tipo: '', texto: '' });

        if (pwForm.nueva !== pwForm.confirmar) {
            setMensajePw({ tipo: 'error', texto: 'La nueva contraseña y su confirmación no coinciden.' });
            return;
        }

        setGuardandoPw(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/usuarios/${modalPassword.id}/password`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ passwordActual: pwForm.actual, nuevaPassword: pwForm.nueva })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al cambiar la contraseña');

            setMensajePw({ tipo: 'exito', texto: '✓ Contraseña actualizada correctamente.' });
            setTimeout(() => {
                setModalPassword(null);
                setPwForm({ actual: '', nueva: '', confirmar: '' });
                setMensajePw({ tipo: '', texto: '' });
            }, 1800);
        } catch (err: any) {
            setMensajePw({ tipo: 'error', texto: err.message });
        } finally {
            setGuardandoPw(false);
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

            {/* Mensaje global (desactivar) */}
            {mensajeGlobal.texto && (
                <div className={`${bannerCls(mensajeGlobal.tipo)} mb-4`}>
                    <span className="material-symbols-outlined text-[16px] shrink-0">
                        {mensajeGlobal.tipo === 'exito' ? 'check_circle' : 'error'}
                    </span>
                    {mensajeGlobal.texto}
                </div>
            )}

            {/* ── Modal: Cambiar contraseña (A-9) ── */}
            {modalPassword && (
                <Modal titulo={`Cambiar contraseña — ${modalPassword.nombre}`} onClose={() => { setModalPassword(null); setPwForm({ actual: '', nueva: '', confirmar: '' }); setMensajePw({ tipo: '', texto: '' }); }}>
                    <form onSubmit={handleCambiarPassword} className="flex flex-col gap-4">
                        <div>
                            <label className="font-label-sm block mb-1">Contraseña actual</label>
                            <input type="password" required value={pwForm.actual} onChange={e => setPwForm({ ...pwForm, actual: e.target.value })} className={inputStyles} placeholder="Ingresá la contraseña actual" />
                        </div>
                        <div>
                            <label className="font-label-sm block mb-1">Nueva contraseña</label>
                            <input
                                type="password" required minLength={8}
                                pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}"
                                title="Mínimo 8 caracteres, una mayúscula, una minúscula y un número"
                                value={pwForm.nueva} onChange={e => setPwForm({ ...pwForm, nueva: e.target.value })}
                                className={inputStyles} placeholder="Mínimo 8 caracteres"
                            />
                        </div>
                        <div>
                            <label className="font-label-sm block mb-1">Confirmar nueva contraseña</label>
                            <input type="password" required value={pwForm.confirmar} onChange={e => setPwForm({ ...pwForm, confirmar: e.target.value })} className={inputStyles} placeholder="Repita la nueva contraseña" />
                        </div>
                        <p className="text-xs text-on-surface-variant">Mínimo 8 caracteres · Al menos una mayúscula, una minúscula y un número.</p>

                        {mensajePw.texto && (
                            <div className={bannerCls(mensajePw.tipo)}>
                                <span className="material-symbols-outlined text-[16px] shrink-0">
                                    {mensajePw.tipo === 'exito' ? 'check_circle' : 'error'}
                                </span>
                                {mensajePw.texto}
                            </div>
                        )}

                        <div className="flex gap-3 justify-end pt-2">
                            <Button variant="outline" type="button" onClick={() => setModalPassword(null)}>Cancelar</Button>
                            <Button variant="primary" type="submit" disabled={guardandoPw}>
                                {guardandoPw ? 'Guardando...' : 'Cambiar contraseña'}
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
                                                    {/* A-9: Cambiar contraseña */}
                                                    <button
                                                        onClick={() => setModalPassword(usr)}
                                                        title="Cambiar contraseña"
                                                        className="p-2 hover:bg-secondary/10 rounded-lg text-secondary transition-colors"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">lock_reset</span>
                                                    </button>
                                                    {/* U-8: Desactivar (solo si está activo) */}
                                                    {usr.activo && (
                                                        <button
                                                            onClick={() => handleDesactivar(usr)}
                                                            title="Desactivar usuario"
                                                            className="p-2 hover:bg-error-container rounded-lg text-error transition-colors"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">person_off</span>
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