import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { cn } from '../utils/cn';

export const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Error al iniciar sesión');
            }

            // Guardamos el token y los datos del usuario en el navegador
            localStorage.setItem('token', result.token);
            localStorage.setItem('rol', result.usuario.rol);
            localStorage.setItem('usuario', JSON.stringify(result.usuario));

            // Redirigimos al sistema
            navigate('/dashboard');

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const inputStyles = "w-full h-11 px-4 rounded-lg border border-outline-variant bg-surface-bright text-on-background focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all outline-none";

    return (
        <div className="min-h-screen bg-surface-container-low flex items-center justify-center p-4">
            <div className="max-w-[420px] w-full bg-surface-container-lowest rounded-2xl shadow-[0_8px_32px_rgba(0,52,111,0.08)] border border-surface-container overflow-hidden">

                {/* Encabezado Institucional */}
                <div className="bg-primary p-8 text-center text-on-primary">
                    <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                        <span className="material-symbols-outlined text-3xl">waves</span>
                    </div>
                    <h1 className="font-h3 text-h3 mb-1">Túnel Subfluvial</h1>
                    <p className="text-primary-fixed-dim text-sm tracking-widest uppercase">Portal de Gestión</p>
                </div>

                {/* Formulario */}
                <form onSubmit={handleLogin} className="p-8 flex flex-col gap-6">
                    {error && (
                        <div className="p-3 bg-error-container/20 border border-error/50 rounded-lg text-error text-sm text-center font-medium">
                            {error}
                        </div>
                    )}

                    <div className="flex flex-col gap-2">
                        <label className="font-label-sm text-on-surface-variant uppercase tracking-wider">Correo Electrónico</label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">mail</span>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={cn(inputStyles, "pl-10")}
                                placeholder="usuario@tunel.gov.ar"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="font-label-sm text-on-surface-variant uppercase tracking-wider">Contraseña</label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">lock</span>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={cn(inputStyles, "pl-10")}
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <Button variant="primary" type="submit" disabled={loading} className="mt-2 h-12 text-base">
                        {loading ? 'Verificando...' : 'Ingresar al Sistema'}
                    </Button>
                </form>
            </div>
        </div>
    );
};