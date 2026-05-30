export const Navbar = () => {
    const usuarioRaw = localStorage.getItem('usuario');
    const usuario = usuarioRaw ? JSON.parse(usuarioRaw) : null;
    const nombreCompleto: string = usuario?.nombre
        ? `${usuario.nombre}${usuario.apellido ? ' ' + usuario.apellido : ''}`
        : usuario?.email ?? 'Usuario';
    const inicial = nombreCompleto.charAt(0).toUpperCase();

    return (
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 h-16 flex justify-between items-center px-8 sticky top-0 z-40 shadow-sm">
            <div className="flex items-center gap-4">
                <div className="relative hidden sm:block">
                </div>
            </div>

            <div className="flex items-center gap-4 text-primary">
                {/* Avatar + nombre del usuario */}
                <div className="flex items-center gap-3 ml-2">
                    <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
                        {inicial}
                    </div>
                    <div className="hidden lg:flex flex-col leading-tight">
                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[150px]">
                            {nombreCompleto}
                        </span>
                        <span className="text-xs text-slate-400 capitalize">
                            {usuario?.rol ?? ''}
                        </span>
                    </div>
                </div>
            </div>
        </header>
    );
};