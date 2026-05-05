export const Navbar = () => {
    return (
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 h-16 flex justify-between items-center px-8 sticky top-0 z-40 shadow-sm">
            <div className="flex items-center gap-4">
                <div className="relative hidden sm:block">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
                    <input
                        type="text"
                        placeholder="Buscar registros..."
                        className="pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-full text-sm focus:ring-2 focus:ring-primary w-64 outline-none transition-shadow"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4 text-primary">
                <button className="p-2 rounded-full hover:bg-slate-50 transition-colors relative">
                    <span className="material-symbols-outlined">notifications</span>
                    <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border-2 border-white"></span>
                </button>
                <button className="p-2 rounded-full hover:bg-slate-50 transition-colors">
                    <span className="material-symbols-outlined">help</span>
                </button>
                <div className="h-8 w-8 rounded-full bg-surface-variant overflow-hidden border border-outline-variant ml-2">
                    <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-500">
                        <span className="material-symbols-outlined text-sm">person</span>
                    </div>
                </div>
            </div>
        </header>
    );
};