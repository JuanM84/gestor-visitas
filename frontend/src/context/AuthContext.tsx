import { createContext, useContext, useState, useCallback } from 'react';
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
}

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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const initial = getInitialState();
    const [token, setToken] = useState<string | null>(initial.token);
    const [usuario, setUsuario] = useState<Usuario | null>(initial.usuario);

    const login = useCallback((newToken: string, newUsuario: Usuario) => {
        localStorage.setItem('token', newToken);
        localStorage.setItem('rol', newUsuario.rol);
        localStorage.setItem('usuario', JSON.stringify(newUsuario));
        setToken(newToken);
        setUsuario(newUsuario);
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('rol');
        localStorage.removeItem('usuario');
        setToken(null);
        setUsuario(null);
    }, []);

    return (
        <AuthContext.Provider value={{ token, usuario, login, logout, isAuthenticated: !!token }}>
            {children}
        </AuthContext.Provider>
    );
};

// ── Hook ──────────────────────────────────────────────────────────────────────

export const useAuth = (): AuthContextValue => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
    return ctx;
};
