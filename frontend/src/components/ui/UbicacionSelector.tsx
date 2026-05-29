import { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '../../utils/cn';

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
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const esArgentina = !value.pais || value.pais.toLowerCase() === 'argentina';

    // Cargar provincias al montar
    useEffect(() => {
        cargarProvincias().then(setProvincias);
    }, []);

    // Cerrar dropdown al clickear fuera
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setMostrarSugerencias(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
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
                setMostrarSugerencias(uniqueItems.length > 0);
            } catch (_err) {
                setSugerencias([]);
            } finally {
                setBuscandoLocalidad(false);
            }
        }, 300);
    }, [esArgentina]);

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

    const handlePaisChange = (pais: string) => {
        const nuevo = { ...value, pais };
        // Si cambia a no-Argentina, limpiamos localidad y provincia para texto libre
        if (pais.toLowerCase() !== 'argentina' && pais !== '') {
            nuevo.localidad = '';
            nuevo.provincia = '';
        }
        onChange(nuevo);
    };

    const inp = cn(
        'w-full h-11 px-4 rounded-lg border border-outline-variant bg-surface-bright text-on-background',
        'focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all',
        inputClassName
    );

    return (
        <div className="flex flex-col gap-3">
            {/* País */}
            <div>
                <label className="font-label-sm block mb-1">
                    País <span className="text-on-surface-variant font-normal">(Opcional)</span>
                </label>
                <input
                    type="text"
                    value={value.pais}
                    onChange={e => handlePaisChange(e.target.value)}
                    className={inp}
                    placeholder="Argentina"
                    list="paises-comunes"
                />
                <datalist id="paises-comunes">
                    <option value="Argentina" />
                    <option value="Brasil" />
                    <option value="Uruguay" />
                    <option value="Paraguay" />
                    <option value="Chile" />
                    <option value="Bolivia" />
                    <option value="Colombia" />
                    <option value="Venezuela" />
                    <option value="España" />
                    <option value="Italia" />
                    <option value="Francia" />
                    <option value="Alemania" />
                    <option value="Estados Unidos" />
                    <option value="México" />
                </datalist>
            </div>

            {/* Provincia */}
            <div>
                <label className="font-label-sm block mb-1">
                    Provincia {required && esArgentina && <span className="text-error">*</span>}
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
                        placeholder="Estado / Región / Provincia"
                    />
                )}
            </div>

            {/* Localidad con autocomplete */}
            <div ref={wrapperRef} className="relative">
                <label className="font-label-sm block mb-1">
                    Localidad {required && <span className="text-error">*</span>}
                </label>
                <div className="relative">
                    <input
                        type="text"
                        value={value.localidad}
                        onChange={e => handleLocalidadChange(e.target.value)}
                        onFocus={() => { if (sugerencias.length > 0) setMostrarSugerencias(true); }}
                        required={required}
                        className={cn(inp, 'pr-10')}
                        placeholder={esArgentina ? 'Ej: Paraná (escribe para buscar)' : 'Ciudad / Localidad'}
                        autoComplete="off"
                    />
                    {buscandoLocalidad && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] text-outline animate-spin">
                            progress_activity
                        </span>
                    )}
                </div>

                {/* Dropdown de sugerencias */}
                {mostrarSugerencias && sugerencias.length > 0 && (
                    <ul className="absolute z-50 w-full mt-1 bg-white border border-outline-variant rounded-xl shadow-lg overflow-hidden max-h-56 overflow-y-auto">
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
