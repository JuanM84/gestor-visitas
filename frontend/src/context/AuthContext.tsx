import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface Usuario {
    id: string;
    nombre: string;
    email: string;
    rol: string;
}

interface AuthContextValue {
    token: string | null;
    usuario: Usuario | null;
    login: (token: string, usuario: Usuario) => void;
    logout: () => void;
    isAuthenticated: boolean;
    /** Minutos de inactividad antes del cierre automático (cargado de la API) */
    sessionTimeoutMinutes: number;
}

// ── Constantes ────────────────────────────────────────────────────────────────

const DEFAULT_TIMEOUT_MINUTES = 30;
const WARNING_BEFORE_SECONDS = 60; // mostrar advertencia 60s antes
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];

// ── Contexto ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

function getInitialState(): { token: string | null; usuario: Usuario | null } {
    const token = localStorage.getItem('token');
    const usuarioRaw = localStorage.getItem('usuario');
    let usuario: Usuario | null = null;
    try {
        if (usuarioRaw) usuario = JSON.parse(usuarioRaw) as Usuario;
    } catch {
        // datos corruptos — limpiar
        localStorage.removeItem('usuario');
        localStorage.removeItem('token');
        localStorage.removeItem('rol');
    }
    return { token, usuario };
}

// ── Modal de advertencia ──────────────────────────────────────────────────────

interface WarningModalProps {
    secondsLeft: number;
    onExtend: () => void;
    onLogout: () => void;
}

function SessionWarningModal({ secondsLeft, onExtend, onLogout }: WarningModalProps) {
    return (
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 99999,
                backgroundColor: 'rgba(0,0,0,0.55)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backdropFilter: 'blur(4px)',
                animation: 'fadeIn 0.2s ease',
            }}
        >
            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
                @keyframes shrink { from { width: 100%; } to { width: 0%; } }
            `}</style>
            <div style={{
                background: 'var(--color-surface-container-lowest, #fff)',
                borderRadius: '1rem',
                padding: '2rem',
                maxWidth: '420px',
                width: '90%',
                boxShadow: '0 24px 48px rgba(0,0,0,0.25)',
                border: '1px solid var(--color-outline-variant, #e0e0e0)',
                textAlign: 'center',
            }}>
                {/* Icono */}
                <div style={{
                    width: '64px', height: '64px',
                    borderRadius: '50%',
                    background: 'var(--color-error-container, #fde0e0)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 1.25rem',
                }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '32px', color: 'var(--color-error, #ba1a1a)' }}>timer_off</span>
                </div>

                <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-on-surface, #1a1a1a)' }}>
                    Sesión por expirar
                </h2>
                <p style={{ margin: '0 0 1.5rem', color: 'var(--color-on-surface-variant, #666)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                    Su sesión se cerrará automáticamente en <strong style={{ color: 'var(--color-error, #ba1a1a)' }}>{secondsLeft}</strong> {secondsLeft === 1 ? 'segundo' : 'segundos'} por inactividad.
                </p>

                {/* Barra de progreso */}
                <div style={{ height: '4px', borderRadius: '2px', background: 'var(--color-surface-container-highest, #e0e0e0)', marginBottom: '1.5rem', overflow: 'hidden' }}>
                    <div style={{
                        height: '100%',
                        background: 'var(--color-error, #ba1a1a)',
                        borderRadius: '2px',
                        width: `${(secondsLeft / WARNING_BEFORE_SECONDS) * 100}%`,
                        transition: 'width 1s linear',
                    }} />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                    <button
                        onClick={onLogout}
                        style={{
                            flex: 1, padding: '0.625rem 1rem', borderRadius: '0.5rem',
                            border: '1px solid var(--color-outline-variant, #ccc)',
                            background: 'transparent', cursor: 'pointer',
                            color: 'var(--color-on-surface-variant, #666)', fontWeight: 500,
                            fontSize: '0.875rem',
                        }}
                    >
                        Cerrar sesión
                    </button>
                    <button
                        onClick={onExtend}
                        style={{
                            flex: 1, padding: '0.625rem 1rem', borderRadius: '0.5rem',
                            border: 'none',
                            background: 'var(--color-primary, #00346f)',
                            cursor: 'pointer',
                            color: 'var(--color-on-primary, #fff)', fontWeight: 600,
                            fontSize: '0.875rem',
                        }}
                    >
                        Continuar sesión
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── AuthProvider ──────────────────────────────────────────────────────────────

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const initial = getInitialState();
    const [token, setToken] = useState<string | null>(initial.token);
    const [usuario, setUsuario] = useState<Usuario | null>(initial.usuario);
    const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState(DEFAULT_TIMEOUT_MINUTES);

    // Estado del modal de advertencia
    const [showWarning, setShowWarning] = useState(false);
    const [warningSecondsLeft, setWarningSecondsLeft] = useState(WARNING_BEFORE_SECONDS);

    // Refs para los timers (no provocan re-render)
    const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const warningCountdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const timeoutMinutesRef = useRef(DEFAULT_TIMEOUT_MINUTES);

    // ── Logout ────────────────────────────────────────────────────────────────

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('rol');
        localStorage.removeItem('usuario');
        setToken(null);
        setUsuario(null);
        setShowWarning(false);
        clearAllTimers();
    }, []);

    // ── Limpiar todos los timers ──────────────────────────────────────────────

    function clearAllTimers() {
        if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
        if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
        if (warningCountdownRef.current) clearInterval(warningCountdownRef.current);
    }

    // ── Iniciar/Resetear el timer de inactividad ──────────────────────────────

    const resetInactivityTimer = useCallback(() => {
        clearAllTimers();
        setShowWarning(false);

        const totalMs = timeoutMinutesRef.current * 60 * 1000;
        const warningMs = totalMs - WARNING_BEFORE_SECONDS * 1000;

        // Timer para mostrar la advertencia
        warningTimerRef.current = setTimeout(() => {
            setWarningSecondsLeft(WARNING_BEFORE_SECONDS);
            setShowWarning(true);

            // Countdown visual
            warningCountdownRef.current = setInterval(() => {
                setWarningSecondsLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(warningCountdownRef.current!);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }, Math.max(warningMs, 0));

        // Timer para el logout automático
        logoutTimerRef.current = setTimeout(() => {
            logout();
        }, totalMs);
    }, [logout]);

    // ── Cargar timeout desde la API ───────────────────────────────────────────

    const loadSessionTimeout = useCallback(async (authToken: string) => {
        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/configuracion/session_timeout_minutes`,
                { headers: { Authorization: `Bearer ${authToken}` } }
            );
            if (res.ok) {
                const data = await res.json();
                const minutes = parseInt(data.valor, 10);
                if (!isNaN(minutes) && minutes > 0) {
                    setSessionTimeoutMinutes(minutes);
                    timeoutMinutesRef.current = minutes;
                }
            }
        } catch {
            // Usamos el valor por defecto silenciosamente
        }
    }, []);

    // ── Login ─────────────────────────────────────────────────────────────────

    const login = useCallback(async (newToken: string, newUsuario: Usuario) => {
        localStorage.setItem('token', newToken);
        localStorage.setItem('rol', newUsuario.rol);
        localStorage.setItem('usuario', JSON.stringify(newUsuario));
        setToken(newToken);
        setUsuario(newUsuario);

        // Cargar el timeout configurado y luego iniciar el timer
        await loadSessionTimeout(newToken);
    }, [loadSessionTimeout]);

    // ── Escuchar actividad del usuario ────────────────────────────────────────

    useEffect(() => {
        if (!token) return;

        // Al montar con sesión ya activa, cargar el timeout y arrancar el timer
        loadSessionTimeout(token).then(() => resetInactivityTimer());

        const handleActivity = () => {
            if (!showWarning) {
                // Solo resetear si el modal NO está visible (si está visible,
                // el usuario debe hacer clic en "Continuar sesión")
                resetInactivityTimer();
            }
        };

        ACTIVITY_EVENTS.forEach(ev => window.addEventListener(ev, handleActivity, { passive: true }));

        return () => {
            ACTIVITY_EVENTS.forEach(ev => window.removeEventListener(ev, handleActivity));
            clearAllTimers();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    // Cuando cambia el timeout (desde configuración), reiniciar el timer si hay sesión
    useEffect(() => {
        timeoutMinutesRef.current = sessionTimeoutMinutes;
        if (token) resetInactivityTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionTimeoutMinutes]);

    // ── Extender sesión desde el modal ────────────────────────────────────────

    const handleExtendSession = useCallback(() => {
        resetInactivityTimer();
    }, [resetInactivityTimer]);

    return (
        <AuthContext.Provider value={{ token, usuario, login, logout, isAuthenticated: !!token, sessionTimeoutMinutes }}>
            {children}
            {showWarning && token && (
                <SessionWarningModal
                    secondsLeft={warningSecondsLeft}
                    onExtend={handleExtendSession}
                    onLogout={logout}
                />
            )}
        </AuthContext.Provider>
    );
};

// ── Hook ──────────────────────────────────────────────────────────────────────

export const useAuth = (): AuthContextValue => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
    return ctx;
};
