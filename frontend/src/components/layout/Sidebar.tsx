import { useState } from 'react';
import { cn } from "../../utils/cn";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ModalMiPerfil } from "../ui/ModalMiPerfil";

const navItems = [
    { name: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
    { name: 'Calendario', icon: 'calendar_today', path: '/calendario' },
    { name: 'Auditoria', icon: 'confirmation_number', path: '/auditoria', roles: ['Admin'] },
    { name: 'Gestores', icon: 'groups', path: '/gestores' },
    { name: 'Listado', icon: 'print', path: '/listado' },
    { name: 'Estadísticas', icon: 'analytics', path: '/estadisticas' },
    { name: 'Usuarios', icon: 'manage_accounts', path: '/usuarios', roles: ['Admin'] },
    { name: 'Configuraciones', icon: 'settings', path: '/configuraciones', roles: ['Admin'] },
];

// Hook exportado para que MainLayout pueda pasar el toggle al Navbar
export const useSidebar = () => {
    const [abierto, setAbierto] = useState(false);
    return { abierto, toggleSidebar: () => setAbierto(p => !p), cerrarSidebar: () => setAbierto(false) };
};

interface SidebarProps {
    abierto: boolean;
    onCerrar: () => void;
}

export const Sidebar = ({ abierto, onCerrar }: SidebarProps) => {
    const navigate = useNavigate();
    const { usuario, logout } = useAuth();
    const userRole = usuario?.rol || 'Guía';
    const [mostrarPerfil, setMostrarPerfil] = useState(false);

    const visibleNavItems = navItems.filter(item =>
        !item.roles || item.roles.some(rol => rol.toLowerCase() === userRole.toLowerCase())
    );

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleNavClick = () => {
        // En móvil cerramos el menú al navegar
        onCerrar();
    };

    return (
        <>
            {/* Overlay para móvil */}
            {abierto && (
                <div
                    className="fixed inset-0 bg-black/40 z-40 md:hidden"
                    onClick={onCerrar}
                />
            )}

            <nav className={cn(
                "bg-white border-r border-slate-200 w-64 h-screen flex flex-col pt-4 fixed left-0 top-0 z-50 shadow-[4px_0_24px_rgba(0,74,153,0.05)] transition-transform duration-300",
                // En desktop: siempre visible. En móvil: controlado por estado
                abierto ? "translate-x-0" : "-translate-x-full md:translate-x-0"
            )}>
                <div className="px-6 mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="font-black text-primary text-lg">Tunnel Subfluvial</h1>
                        <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">Gestión de Visitas</p>
                    </div>
                    {/* Botón cerrar visible solo en móvil */}
                    <button
                        onClick={onCerrar}
                        className="p-1 rounded-full hover:bg-slate-100 text-slate-400 md:hidden"
                    >
                        <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                </div>

                <ul className="flex flex-col flex-1 w-full gap-1 overflow-y-auto min-h-0 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
                    {visibleNavItems.map((item) => (
                        <li key={item.name}>
                            <NavLink
                                to={item.path}
                                onClick={handleNavClick}
                                className={({ isActive }) => cn(
                                    "flex items-center gap-3 w-full px-6 py-3 transition-all duration-100",
                                    isActive
                                        ? "bg-slate-50 text-primary border-r-4 border-primary font-bold"
                                        : "text-slate-500 hover:text-primary hover:bg-slate-50"
                                )}
                            >
                                <span className="material-symbols-outlined text-[20px]">
                                    {item.icon}
                                </span>
                                <span>{item.name}</span>
                            </NavLink>
                        </li>
                    ))}
                </ul>

                {/* Footer del sidebar */}
                <div className="px-4 py-4 border-t border-slate-200 flex flex-col gap-1">
                    {/* Mi Perfil */}
                    <button
                        id="btn-sidebar-mi-perfil"
                        onClick={() => setMostrarPerfil(true)}
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-slate-500 hover:text-primary hover:bg-slate-50 transition-all duration-150 group"
                    >
                        <span className="material-symbols-outlined text-[20px] group-hover:text-primary transition-colors">
                            manage_accounts
                        </span>
                        <div className="flex flex-col items-start">
                            <span className="text-sm font-medium">Mi Perfil</span>
                            <span className="text-[11px] text-slate-400 truncate max-w-[140px]">{usuario?.email}</span>
                        </div>
                    </button>

                    {/* Cerrar Sesión */}
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-slate-500 hover:text-error hover:bg-red-50 transition-all duration-150 group"
                    >
                        <span className="material-symbols-outlined text-[20px] group-hover:text-error transition-colors">
                            logout
                        </span>
                        <span className="text-sm font-medium">Cerrar Sesión</span>
                    </button>
                </div>
            </nav>

            {/* Modal Mi Perfil */}
            {mostrarPerfil && (
                <ModalMiPerfil onCerrar={() => setMostrarPerfil(false)} />
            )}
        </>
    );
};