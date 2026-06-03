import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';

interface Props {
    onCerrar: () => void;
}

type Tab = 'contacto' | 'password';

interface FormContacto {
    email: string;
    telefono: string;
}

interface FormPassword {
    passwordActual: string;
    nuevaPassword: string;
    confirmarPassword: string;
}

const API = import.meta.env.VITE_API_URL;

export function ModalMiPerfil({ onCerrar }: Props) {
    const { usuario, token, actualizarUsuario } = useAuth();
    const [tab, setTab] = useState<Tab>('contacto');

    // ── Estado formulario contacto ─────────────────────────────────────────────
    const [formContacto, setFormContacto] = useState<FormContacto>({ email: '', telefono: '' });
    const [loadingContacto, setLoadingContacto] = useState(false);
    const [mensajeContacto, setMensajeContacto] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

    // ── Estado formulario contraseña ───────────────────────────────────────────
    const [formPassword, setFormPassword] = useState<FormPassword>({
        passwordActual: '',
        nuevaPassword: '',
        confirmarPassword: '',
    });
    const [mostrarPass, setMostrarPass] = useState({ actual: false, nueva: false, confirmar: false });
    const [loadingPassword, setLoadingPassword] = useState(false);
    const [mensajePassword, setMensajePassword] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

    // ── Cargar perfil actual ───────────────────────────────────────────────────
    const cargarPerfil = useCallback(async () => {
        if (!usuario || !token) return;
        try {
            const res = await fetch(`${API}/api/usuarios/${usuario.id}/perfil`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setFormContacto({ email: data.email || '', telefono: data.telefono || '' });
            }
        } catch {
            // Fallback a datos del contexto
            setFormContacto({ email: usuario.email || '', telefono: usuario.telefono || '' });
        }
    }, [usuario, token]);

    useEffect(() => { cargarPerfil(); }, [cargarPerfil]);

    // ── Cerrar con Escape ──────────────────────────────────────────────────────
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCerrar(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onCerrar]);

    // ── Guardar datos de contacto ──────────────────────────────────────────────
    const handleGuardarContacto = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!usuario || !token) return;
        if (!formContacto.email.trim()) {
            setMensajeContacto({ tipo: 'error', texto: 'El email es obligatorio.' });
            return;
        }
        setLoadingContacto(true);
        setMensajeContacto(null);
        try {
            const res = await fetch(`${API}/api/usuarios/${usuario.id}/perfil`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ email: formContacto.email.trim(), telefono: formContacto.telefono.trim() || null }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al actualizar.');
            actualizarUsuario({ email: data.usuario.email, telefono: data.usuario.telefono });
            setMensajeContacto({ tipo: 'ok', texto: 'Datos actualizados correctamente.' });
        } catch (err: any) {
            setMensajeContacto({ tipo: 'error', texto: err.message });
        } finally {
            setLoadingContacto(false);
        }
    };

    // ── Cambiar contraseña ─────────────────────────────────────────────────────
    const handleCambiarPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!usuario || !token) return;
        if (formPassword.nuevaPassword !== formPassword.confirmarPassword) {
            setMensajePassword({ tipo: 'error', texto: 'Las contraseñas nuevas no coinciden.' });
            return;
        }
        setLoadingPassword(true);
        setMensajePassword(null);
        try {
            const res = await fetch(`${API}/api/usuarios/${usuario.id}/password`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    passwordActual: formPassword.passwordActual,
                    nuevaPassword: formPassword.nuevaPassword,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al cambiar la contraseña.');
            setMensajePassword({ tipo: 'ok', texto: 'Contraseña actualizada correctamente.' });
            setFormPassword({ passwordActual: '', nuevaPassword: '', confirmarPassword: '' });
        } catch (err: any) {
            setMensajePassword({ tipo: 'error', texto: err.message });
        } finally {
            setLoadingPassword(false);
        }
    };

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 9999,
                backgroundColor: 'rgba(0,0,0,0.45)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backdropFilter: 'blur(4px)',
                animation: 'modalFadeIn 0.2s ease',
                padding: '1rem',
            }}
            onClick={(e) => { if (e.target === e.currentTarget) onCerrar(); }}
        >
            <style>{`
                @keyframes modalFadeIn { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
            `}</style>

            <div style={{
                background: '#ffffff',
                borderRadius: '1rem',
                width: '100%',
                maxWidth: '480px',
                boxShadow: '0 24px 64px rgba(0,74,153,0.15)',
                border: '1px solid #e2e8f0',
                overflow: 'hidden',
            }}>
                {/* Header */}
                <div style={{
                    padding: '1.5rem 1.5rem 0',
                    background: 'linear-gradient(135deg, #004a99 0%, #0066cc 100%)',
                    color: '#fff',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{
                                width: '40px', height: '40px', borderRadius: '50%',
                                background: 'rgba(255,255,255,0.2)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>manage_accounts</span>
                            </div>
                            <div>
                                <p style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Mi Perfil</p>
                                <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8 }}>{usuario?.nombre} · {usuario?.rol}</p>
                            </div>
                        </div>
                        <button
                            id="btn-cerrar-modal-perfil"
                            onClick={onCerrar}
                            style={{
                                background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%',
                                width: '32px', height: '32px', cursor: 'pointer', display: 'flex',
                                alignItems: 'center', justifyContent: 'center', color: '#fff',
                            }}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
                        </button>
                    </div>

                    {/* Tabs */}
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                        {([
                            { id: 'contacto', label: 'Datos de contacto', icon: 'contact_mail' },
                            { id: 'password', label: 'Contraseña', icon: 'lock' },
                        ] as { id: Tab; label: string; icon: string }[]).map(t => (
                            <button
                                key={t.id}
                                id={`tab-perfil-${t.id}`}
                                onClick={() => { setTab(t.id); setMensajeContacto(null); setMensajePassword(null); }}
                                style={{
                                    padding: '0.6rem 1rem',
                                    borderRadius: '0.5rem 0.5rem 0 0',
                                    border: 'none',
                                    background: tab === t.id ? '#ffffff' : 'rgba(255,255,255,0.15)',
                                    color: tab === t.id ? '#004a99' : 'rgba(255,255,255,0.85)',
                                    fontWeight: tab === t.id ? 700 : 500,
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                                    transition: 'all 0.15s ease',
                                }}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{t.icon}</span>
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Body */}
                <div style={{ padding: '1.5rem' }}>

                    {/* ── Tab: Datos de contacto ── */}
                    {tab === 'contacto' && (
                        <form onSubmit={handleGuardarContacto} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <p style={{ margin: '0 0 0.5rem', fontSize: '0.82rem', color: '#64748b', lineHeight: 1.5 }}>
                                Podés actualizar tu correo electrónico y número de teléfono. Tu nombre y rol son administrados por el sistema.
                            </p>

                            {/* Campo nombre (solo lectura) */}
                            <FieldGroup label="Nombre completo" icon="badge">
                                <input
                                    type="text"
                                    value={usuario?.nombre || ''}
                                    disabled
                                    style={{ ...inputStyle, background: '#f8fafc', color: '#94a3b8', cursor: 'not-allowed' }}
                                />
                            </FieldGroup>

                            {/* Email */}
                            <FieldGroup label="Correo electrónico *" icon="email">
                                <input
                                    id="input-perfil-email"
                                    type="email"
                                    required
                                    value={formContacto.email}
                                    onChange={e => setFormContacto(p => ({ ...p, email: e.target.value }))}
                                    placeholder="correo@ejemplo.com"
                                    style={inputStyle}
                                />
                            </FieldGroup>

                            {/* Teléfono */}
                            <FieldGroup label="Teléfono" icon="phone">
                                <input
                                    id="input-perfil-telefono"
                                    type="tel"
                                    value={formContacto.telefono}
                                    onChange={e => setFormContacto(p => ({ ...p, telefono: e.target.value }))}
                                    placeholder="+54 343 xxx-xxxx (opcional)"
                                    style={inputStyle}
                                />
                            </FieldGroup>

                            {mensajeContacto && <Alerta tipo={mensajeContacto.tipo} texto={mensajeContacto.texto} />}

                            <button
                                id="btn-guardar-contacto"
                                type="submit"
                                disabled={loadingContacto}
                                style={{ ...btnPrimaryStyle, opacity: loadingContacto ? 0.7 : 1, cursor: loadingContacto ? 'not-allowed' : 'pointer' }}
                            >
                                {loadingContacto
                                    ? <><span className="material-symbols-outlined" style={{ fontSize: '18px', animation: 'spin 1s linear infinite' }}>progress_activity</span> Guardando...</>
                                    : <><span className="material-symbols-outlined" style={{ fontSize: '18px' }}>save</span> Guardar cambios</>
                                }
                            </button>
                        </form>
                    )}

                    {/* ── Tab: Contraseña ── */}
                    {tab === 'password' && (
                        <form onSubmit={handleCambiarPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <p style={{ margin: '0 0 0.5rem', fontSize: '0.82rem', color: '#64748b', lineHeight: 1.5 }}>
                                La nueva contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número.
                            </p>

                            <PasswordField
                                id="input-password-actual"
                                label="Contraseña actual"
                                value={formPassword.passwordActual}
                                onChange={v => setFormPassword(p => ({ ...p, passwordActual: v }))}
                                visible={mostrarPass.actual}
                                onToggle={() => setMostrarPass(p => ({ ...p, actual: !p.actual }))}
                            />
                            <PasswordField
                                id="input-password-nueva"
                                label="Nueva contraseña"
                                value={formPassword.nuevaPassword}
                                onChange={v => setFormPassword(p => ({ ...p, nuevaPassword: v }))}
                                visible={mostrarPass.nueva}
                                onToggle={() => setMostrarPass(p => ({ ...p, nueva: !p.nueva }))}
                            />
                            <PasswordField
                                id="input-password-confirmar"
                                label="Confirmar nueva contraseña"
                                value={formPassword.confirmarPassword}
                                onChange={v => setFormPassword(p => ({ ...p, confirmarPassword: v }))}
                                visible={mostrarPass.confirmar}
                                onToggle={() => setMostrarPass(p => ({ ...p, confirmar: !p.confirmar }))}
                            />

                            {/* Indicador de requisitos */}
                            {formPassword.nuevaPassword && (
                                <PasswordStrength password={formPassword.nuevaPassword} />
                            )}

                            {mensajePassword && <Alerta tipo={mensajePassword.tipo} texto={mensajePassword.texto} />}

                            <button
                                id="btn-cambiar-password"
                                type="submit"
                                disabled={loadingPassword}
                                style={{ ...btnPrimaryStyle, opacity: loadingPassword ? 0.7 : 1, cursor: loadingPassword ? 'not-allowed' : 'pointer' }}
                            >
                                {loadingPassword
                                    ? <><span className="material-symbols-outlined" style={{ fontSize: '18px' }}>progress_activity</span> Actualizando...</>
                                    : <><span className="material-symbols-outlined" style={{ fontSize: '18px' }}>lock_reset</span> Cambiar contraseña</>
                                }
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Subcomponentes ─────────────────────────────────────────────────────────────

function FieldGroup({ label, icon, children }: { label: string; icon: string; children: React.ReactNode }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '15px', color: '#94a3b8' }}>{icon}</span>
                {label}
            </label>
            {children}
        </div>
    );
}

function PasswordField({
    id, label, value, onChange, visible, onToggle,
}: {
    id: string; label: string; value: string;
    onChange: (v: string) => void; visible: boolean; onToggle: () => void;
}) {
    return (
        <FieldGroup label={label} icon="lock">
            <div style={{ position: 'relative' }}>
                <input
                    id={id}
                    type={visible ? 'text' : 'password'}
                    required
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    style={{ ...inputStyle, paddingRight: '2.8rem' }}
                />
                <button
                    type="button"
                    onClick={onToggle}
                    tabIndex={-1}
                    style={{
                        position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0,
                    }}
                >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                        {visible ? 'visibility_off' : 'visibility'}
                    </span>
                </button>
            </div>
        </FieldGroup>
    );
}

function PasswordStrength({ password }: { password: string }) {
    const checks = [
        { ok: password.length >= 8, label: 'Mínimo 8 caracteres' },
        { ok: /[A-Z]/.test(password), label: 'Una mayúscula' },
        { ok: /[a-z]/.test(password), label: 'Una minúscula' },
        { ok: /\d/.test(password), label: 'Un número' },
    ];
    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
            {checks.map(c => (
                <span key={c.label} style={{
                    fontSize: '0.72rem', padding: '0.2rem 0.5rem', borderRadius: '999px',
                    background: c.ok ? '#dcfce7' : '#f1f5f9',
                    color: c.ok ? '#166534' : '#94a3b8',
                    display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 500,
                }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>
                        {c.ok ? 'check_circle' : 'radio_button_unchecked'}
                    </span>
                    {c.label}
                </span>
            ))}
        </div>
    );
}

function Alerta({ tipo, texto }: { tipo: 'ok' | 'error'; texto: string }) {
    return (
        <div style={{
            padding: '0.6rem 0.9rem', borderRadius: '0.5rem',
            background: tipo === 'ok' ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${tipo === 'ok' ? '#86efac' : '#fca5a5'}`,
            color: tipo === 'ok' ? '#166534' : '#dc2626',
            fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
        }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                {tipo === 'ok' ? 'check_circle' : 'error'}
            </span>
            {texto}
        </div>
    );
}

// ── Estilos compartidos ────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.55rem 0.85rem',
    borderRadius: '0.5rem',
    border: '1px solid #e2e8f0',
    fontSize: '0.875rem',
    color: '#1e293b',
    outline: 'none',
    transition: 'border-color 0.15s ease',
    boxSizing: 'border-box',
    background: '#ffffff',
};

const btnPrimaryStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
    padding: '0.65rem 1.25rem',
    borderRadius: '0.5rem',
    border: 'none',
    background: 'linear-gradient(135deg, #004a99, #0066cc)',
    color: '#ffffff',
    fontWeight: 600,
    fontSize: '0.875rem',
    transition: 'opacity 0.15s ease',
    width: '100%',
    marginTop: '0.25rem',
};
