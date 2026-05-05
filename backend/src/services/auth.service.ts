import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthRepository } from '../repositories/auth.repository';
import { pool } from '../config/db';

export const AuthService = {
    async login(email: string, passwordPlana: string) {
        const emailLimpio = email.trim();
        // 1. Buscamos al usuario
        const usuario = await AuthRepository.buscarUsuarioPorEmail(emailLimpio);

        if (!usuario) {
            throw new Error('Credenciales inválidas');
        }

        if (!usuario.activo) {
            throw new Error('El usuario está inactivo. Contacte al administrador.');
        }

        // 2. Comparamos las contraseñas
        const passwordValida = await bcrypt.compare(passwordPlana, usuario.password_hash);

        if (!passwordValida) {
            throw new Error('Credenciales inválidas');
        }

        // 3. Generamos el Token JWT
        const token = jwt.sign(
            { id: usuario.id, rol: usuario.rol, nombre: usuario.nombre },
            process.env.JWT_SECRET || 'secreto_fallback',
            { expiresIn: '8h' } // El token dura una jornada laboral
        );

        return {
            token,
            usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol }
        };
    }
};