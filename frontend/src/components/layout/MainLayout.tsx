import { useState } from 'react';
import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

interface MainLayoutProps {
    children: ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
    const [sidebarAbierto, setSidebarAbierto] = useState(false);

    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar abierto={sidebarAbierto} onCerrar={() => setSidebarAbierto(false)} />

            <div className="flex-1 flex flex-col md:ml-64">
                {/* Navbar inline con botón hamburguesa */}
                <header className="bg-white border-b border-slate-200 h-16 flex justify-between items-center px-4 md:px-8 sticky top-0 z-40 shadow-sm">
                    <div className="flex items-center gap-3">
                        {/* Botón hamburguesa — visible solo en móvil */}
                        <button
                            onClick={() => setSidebarAbierto(p => !p)}
                            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors md:hidden"
                            aria-label="Abrir menú"
                        >
                            <span className="material-symbols-outlined text-[22px]">menu</span>
                        </button>

                        <div className="relative hidden sm:block">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
                            <input
                                type="text"
                                placeholder="Buscar registros..."
                                className="pl-10 pr-4 py-2 bg-slate-50 border-none rounded-full text-sm focus:ring-2 focus:ring-primary w-64 outline-none transition-shadow"
                            />
                        </div>
                    </div>

                    <NavbarUserInfo />
                </header>

                <main className="p-margin max-w-[1440px] mx-auto w-full flex flex-col gap-lg pb-xl">
                    {children}
                </main>
            </div>
        </div>
    );
};

// Sub-componente de usuario reutilizable
const NavbarUserInfo = () => {
    const usuarioRaw = localStorage.getItem('usuario');
    const usuario = usuarioRaw ? JSON.parse(usuarioRaw) : null;
    const nombreCompleto: string = usuario?.nombre
        ? `${usuario.nombre}${usuario.apellido ? ' ' + usuario.apellido : ''}`
        : usuario?.email ?? 'Usuario';
    const inicial = nombreCompleto.charAt(0).toUpperCase();

    return (
        <div className="flex items-center gap-3 text-primary">
            <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
                {inicial}
            </div>
            <div className="hidden lg:flex flex-col leading-tight">
                <span className="text-sm font-semibold text-slate-800 truncate max-w-[150px]">{nombreCompleto}</span>
                <span className="text-xs text-slate-400 capitalize">{usuario?.rol ?? ''}</span>
            </div>
        </div>
    );
};