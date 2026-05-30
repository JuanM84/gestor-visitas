// ── Validadores reutilizables del backend ────────────────────────────────────

/**
 * V-20 — Valida el formato de un número de teléfono.
 * Acepta: 3434000000 | 0343-4000000 | +54 343 4000000 | (343) 4000000
 * Mínimo 7 caracteres numéricos, máximo 20 caracteres en total.
 */
export function validarTelefono(tel: string): boolean {
    return /^[\d\s\+\-\(\)]{7,20}$/.test(tel.trim());
}

/**
 * Valida el formato de un email.
 */
export function validarEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Valida la política de complejidad de contraseña.
 * Mínimo 8 caracteres, al menos una mayúscula, una minúscula y un número.
 */
export function validarPassword(password: string): { valida: boolean; mensaje?: string } {
    if (!password || password.length < 8) {
        return { valida: false, mensaje: 'La contraseña debe tener al menos 8 caracteres' };
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)) {
        return { valida: false, mensaje: 'La contraseña debe tener al menos una mayúscula, una minúscula y un número' };
    }
    return { valida: true };
}
