import { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '../../utils/cn';
import { paises } from '../../data/paises.js';

// ── Caché de módulo: las provincias se cargan UNA sola vez para toda la sesión ──
let provinciasCacheadas: { id: string; nombre: string }[] | null = null;
let cargandoProvincias = false;
const listeners: (() => void)[] = [];

async function cargarProvincias() {
    if (provinciasCacheadas) return provinciasCacheadas;
    if (cargandoProvincias) {
        return new Promise<{ id: string; nombre: string }[]>((resolve) => {
            listeners.push(() => resolve(provinciasCacheadas!));
        });
    }
    cargandoProvincias = true;
    try {
        const res = await fetch('https://apis.datos.gob.ar/georef/api/provincias?max=100&orden=nombre');
        const data = await res.json();
        provinciasCacheadas = (data.provincias as any[])
            .map(p => ({ id: p.id, nombre: p.nombre }))
            .sort((a, b) => a.nombre.localeCompare(b.nombre));
    } catch (_err) {
        provinciasCacheadas = [];
    }
    cargandoProvincias = false;
    listeners.forEach(fn => fn());
    listeners.length = 0;
    return provinciasCacheadas;
}

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface UbicacionValue {
    localidad: string;
    provincia: string;
    pais: string;
}

interface Props {
    value: UbicacionValue;
    onChange: (value: UbicacionValue) => void;
    inputClassName?: string;
    required?: boolean;
}

// ── Componente ────────────────────────────────────────────────────────────────

export const UbicacionSelector = ({ value, onChange, inputClassName, required = false }: Props) => {
    const [provincias, setProvincias] = useState<{ id: string; nombre: string }[]>([]);
    const [sugerencias, setSugerencias] = useState<{ nombre: string; provincia: string }[]>([]);
    const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
    const [buscandoLocalidad, setBuscandoLocalidad] = useState(false);

    // Autocomplete de país
    const [busquedaPais, setBusquedaPais] = useState(value.pais || 'Argentina');
    const [sugerenciasPais, setSugerenciasPais] = useState<{ id: string; nombre: string }[]>([]);
    const [mostrarDropdownPais, setMostrarDropdownPais] = useState(false);
    const [dropdownPaisStyle, setDropdownPaisStyle] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });
    const inputPaisRef = useRef<HTMLInputElement>(null);

    // Para posicionar el dropdown con fixed (escapa overflow:hidden de los modales)
    const [dropdownStyle, setDropdownStyle] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const inputLocalidadRef = useRef<HTMLInputElement>(null);

    const esArgentina = !value.pais || value.pais.toLowerCase() === 'argentina';

    // Sincronizar el texto del input cuando el valor cambia externamente (ej: reset del form desde el padre).
    // Sin fallback a 'Argentina' para no resetear el campo mientras el usuario escribe.
    useEffect(() => {
        setBusquedaPais(value.pais);
    }, [value.pais]);

    // Cargar provincias al montar
    useEffect(() => {
        cargarProvincias().then(setProvincias);
    }, []);

    // Cerrar dropdown al clickear fuera
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (
                inputLocalidadRef.current &&
                !inputLocalidadRef.current.contains(e.target as Node)
            ) {
                setMostrarSugerencias(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Recalcular posición del dropdown cuando se muestra
    const recalcularPosicion = useCallback(() => {
        if (!inputLocalidadRef.current) return;
        const rect = inputLocalidadRef.current.getBoundingClientRect();
        // position:fixed es relativo al viewport — NO sumar scroll
        setDropdownStyle({
            top: rect.bottom + 4,
            left: rect.left,
            width: rect.width,
        });
    }, []);

    // Búsqueda de localidades con debounce 300ms
    const buscarLocalidades = useCallback((texto: string, provinciaId?: string) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (!esArgentina || texto.trim().length < 2) {
            setSugerencias([]);
            setMostrarSugerencias(false);
            return;
        }
        debounceRef.current = setTimeout(async () => {
            setBuscandoLocalidad(true);
            try {
                const params = new URLSearchParams({ nombre: texto, max: '8' });
                if (provinciaId) params.set('provincia', provinciaId);
                const res = await fetch(
                    `https://apis.datos.gob.ar/georef/api/localidades-censales?${params}`
                );
                const data = await res.json();
                const items = (data.localidades_censales as any[]).map(l => ({
                    nombre: l.nombre,
                    provincia: l.provincia.nombre,
                }));
                // Eliminar duplicados nombre+provincia
                const vistos = new Set<string>();
                const uniqueItems = items.filter(i => {
                    const key = `${i.nombre}|${i.provincia}`;
                    if (vistos.has(key)) return false;
                    vistos.add(key);
                    return true;
                });
                setSugerencias(uniqueItems);
                if (uniqueItems.length > 0) {
                    recalcularPosicion();
                    setMostrarSugerencias(true);
                } else {
                    setMostrarSugerencias(false);
                }
            } catch (_err) {
                setSugerencias([]);
            } finally {
                setBuscandoLocalidad(false);
            }
        }, 300);
    }, [esArgentina, recalcularPosicion]);

    const handleLocalidadChange = (texto: string) => {
        onChange({ ...value, localidad: texto });
        const provSeleccionada = provincias.find(p => p.nombre === value.provincia);
        buscarLocalidades(texto, provSeleccionada?.id);
    };

    const handleSeleccionarSugerencia = (sug: { nombre: string; provincia: string }) => {
        onChange({ ...value, localidad: sug.nombre, provincia: sug.provincia });
        setMostrarSugerencias(false);
    };

    const handleProvinciaChange = (prov: string) => {
        onChange({ ...value, provincia: prov, localidad: '' });
        setSugerencias([]);
    };

    const handlePaisChange = (paisNombre: string) => {
        // Solo actualiza el texto visible y el dropdown.
        // NO llama a onChange mientras el usuario tipea: eso causaba que value.pais
        // cambiara en cada tecla, disparando el useEffect y reseteando el campo.
        setBusquedaPais(paisNombre);

        if (paisNombre.trim().length >= 1) {
            const filtrados = paises
                .filter(p => p.nombre.toLowerCase().includes(paisNombre.toLowerCase()))
                .slice(0, 8);
            setSugerenciasPais(filtrados);
            if (inputPaisRef.current) {
                const rect = inputPaisRef.current.getBoundingClientRect();
                setDropdownPaisStyle({ top: rect.bottom + 4, left: rect.left, width: rect.width });
            }
            setMostrarDropdownPais(filtrados.length > 0);
        } else {
            setSugerenciasPais([]);
            setMostrarDropdownPais(false);
        }
    };

    const handleSeleccionarPais = (pais: { id: string; nombre: string }) => {
        // Al seleccionar del dropdown, se compromete el valor al padre.
        setBusquedaPais(pais.nombre);
        setSugerenciasPais([]);
        setMostrarDropdownPais(false);
        const nuevo = { ...value, pais: pais.nombre };
        if (pais.nombre.toLowerCase() !== 'argentina') {
            nuevo.localidad = '';
            nuevo.provincia = '';
        }
        onChange(nuevo);
    };

    const handlePaisBlur = () => {
        setTimeout(() => setMostrarDropdownPais(false), 150);
        // Al salir del campo, commitear lo que quede escrito al padre
        // (permite escribir un país manualmente sin elegir del dropdown).
        // Si el campo está vacío, no se fuerza Argentina: se deja vacío.
        const textoFinal = busquedaPais.trim();
        if (textoFinal !== value.pais) {
            const nuevo = { ...value, pais: textoFinal };
            if (textoFinal.toLowerCase() !== 'argentina' && textoFinal !== '') {
                nuevo.localidad = '';
                nuevo.provincia = '';
            }
            onChange(nuevo);
        }
    };

    const inp = cn(
        'w-full h-11 px-4 rounded-lg border border-outline-variant bg-surface-bright text-on-background',
        'focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all',
        inputClassName
    );

    return (
        <div className="flex flex-col gap-3">
            {/* País — autocomplete con dropdown */}
            <div className="relative">
                <label className="font-label-sm block mb-1">
                    País {required && <span className="text-error">*</span>}
                </label>
                <div className="relative">
                    <input
                        ref={inputPaisRef}
                        type="text"
                        value={busquedaPais}
                        onChange={e => handlePaisChange(e.target.value)}
                        onFocus={() => {
                            if (busquedaPais.trim().length >= 1) {
                                const filtrados = paises
                                    .filter(p => p.nombre.toLowerCase().includes(busquedaPais.toLowerCase()))
                                    .slice(0, 8);
                                setSugerenciasPais(filtrados);
                                if (inputPaisRef.current) {
                                    const rect = inputPaisRef.current.getBoundingClientRect();
                                    setDropdownPaisStyle({ top: rect.bottom + 4, left: rect.left, width: rect.width });
                                }
                                setMostrarDropdownPais(filtrados.length > 0);
                            }
                        }}
                        onBlur={handlePaisBlur}
                        className={inp}
                        placeholder="Argentina"
                        required={required}
                        autoComplete="off"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[16px] text-outline pointer-events-none">
                        public
                    </span>
                </div>

                {mostrarDropdownPais && sugerenciasPais.length > 0 && (
                    <ul
                        style={{
                            position: 'fixed',
                            top: dropdownPaisStyle.top,
                            left: dropdownPaisStyle.left,
                            width: dropdownPaisStyle.width,
                            zIndex: 9999,
                        }}
                        className="bg-white border border-outline-variant rounded-xl shadow-lg overflow-hidden max-h-56 overflow-y-auto"
                    >
                        {sugerenciasPais.map(p => (
                            <li
                                key={p.id}
                                onMouseDown={() => handleSeleccionarPais(p)}
                                className="px-4 py-2.5 cursor-pointer hover:bg-primary/5 text-sm font-medium text-on-surface"
                            >
                                {p.nombre}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Provincia */}
            <div>
                <label className="font-label-sm block mb-1">
                    Provincia
                    {required && esArgentina && <span className="text-error">*</span>}
                    {!esArgentina && <span className="text-on-surface-variant font-normal"> (Opcional)</span>}
                </label>
                {esArgentina ? (
                    <select
                        value={value.provincia}
                        onChange={e => handleProvinciaChange(e.target.value)}
                        required={required && esArgentina}
                        className={cn(inp, 'cursor-pointer')}
                    >
                        <option value="">— Seleccionar provincia —</option>
                        {provincias.map(p => (
                            <option key={p.id} value={p.nombre}>{p.nombre}</option>
                        ))}
                    </select>
                ) : (
                    <input
                        type="text"
                        value={value.provincia}
                        onChange={e => onChange({ ...value, provincia: e.target.value })}
                        className={inp}
                        placeholder="No especificado"
                    />
                )}
            </div>

            {/* Localidad con autocomplete — dropdown con position:fixed para escapar overflow:hidden */}
            <div className="relative">
                <label className="font-label-sm block mb-1">
                    Localidad
                    {required && esArgentina && <span className="text-error">*</span>}
                    {!esArgentina && <span className="text-on-surface-variant font-normal"> (Opcional)</span>}
                </label>
                <div className="relative">
                    <input
                        ref={inputLocalidadRef}
                        type="text"
                        value={value.localidad}
                        onChange={e => handleLocalidadChange(e.target.value)}
                        onFocus={() => {
                            if (sugerencias.length > 0) {
                                recalcularPosicion();
                                setMostrarSugerencias(true);
                            }
                        }}
                        required={required && esArgentina}
                        className={cn(inp, 'pr-10')}
                        placeholder={esArgentina ? 'Ej: Paraná (escribe para buscar)' : 'No especificado'}
                        autoComplete="off"
                    />
                    {buscandoLocalidad && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] text-outline animate-spin">
                            progress_activity
                        </span>
                    )}
                </div>

                {/* Dropdown posicionado con fixed para escapar overflow:hidden de los modales */}
                {mostrarSugerencias && sugerencias.length > 0 && (
                    <ul
                        style={{
                            position: 'fixed',
                            top: dropdownStyle.top,
                            left: dropdownStyle.left,
                            width: dropdownStyle.width,
                            zIndex: 9999,
                        }}
                        className="bg-white border border-outline-variant rounded-xl shadow-lg overflow-hidden max-h-56 overflow-y-auto"
                    >
                        {sugerencias.map((sug, i) => (
                            <li
                                key={i}
                                onMouseDown={() => handleSeleccionarSugerencia(sug)}
                                className="px-4 py-2.5 cursor-pointer hover:bg-primary/5 flex justify-between items-center text-sm"
                            >
                                <span className="font-medium text-on-surface">{sug.nombre}</span>
                                <span className="text-xs text-outline ml-2 shrink-0">{sug.provincia}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};
