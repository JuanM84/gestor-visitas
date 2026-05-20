import { cn } from "../../utils/cn";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const navItems = [
    { name: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
    { name: 'Calendario', icon: 'calendar_today', path: '/calendario' },
    { name: 'Visitas', icon: 'confirmation_number', path: '/visitas', roles: ['Admin'] },
    { name: 'Auditoria', icon: 'confirmation_number', path: '/auditoria', roles: ['Admin'] },
    { name: 'Gestores', icon: 'groups', path: '/gestores' },
    { name: 'Reportes', icon: 'analytics', path: '/reportes' },
    { name: 'Usuarios', icon: 'manage_accounts', path: '/usuarios', roles: ['Admin'] },
    { name: 'Configuraciones', icon: 'settings', path: '/configuraciones', roles: ['Admin'] },
];

export const Sidebar = () => {
    const navigate = useNavigate();
    const { usuario, logout } = useAuth();
    const userRole = usuario?.rol || 'Guía';

    const visibleNavItems = navItems.filter(item =>
        !item.roles || item.roles.some(rol => rol.toLowerCase() === userRole.toLowerCase())
    );

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 w-64 h-screen flex flex-col pt-4 fixed left-0 top-0 z-50 shadow-[4px_0_24px_rgba(0,74,153,0.05)] hidden md:flex">
            <div className="px-6 mb-8">
                <h1 className="font-black text-primary dark:text-blue-400 text-lg">Tunnel Subfluvial</h1>
                <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">Gestión de Visitas</p>
            </div>

            <ul className="flex flex-col flex-1 w-full gap-1">
                {visibleNavItems.map((item) => (
                    <li key={item.name}>
                        {/* NavLink inyecta la clase 'active' automáticamente a la ruta actual */}
                        <NavLink
                            to={item.path}
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

            {/* Botón Cerrar Sesión */}
            <div className="px-4 py-4 border-t border-slate-200 dark:border-slate-800">
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
    );
};