"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_repository_1 = require("../repositories/auth.repository");
exports.AuthService = {
    async login(email, passwordPlana) {
        const emailLimpio = email.trim();
        // 1. Buscamos al usuario
        const usuario = await auth_repository_1.AuthRepository.buscarUsuarioPorEmail(emailLimpio);
        if (!usuario) {
            throw new Error('Credenciales inválidas');
        }
        if (!usuario.activo) {
            throw new Error('El usuario está inactivo. Contacte al administrador.');
        }
        // 2. Comparamos las contraseñas
        const passwordValida = await bcryptjs_1.default.compare(passwordPlana, usuario.password_hash);
        if (!passwordValida) {
            throw new Error('Credenciales inválidas');
        }
        // 3. Generamos el Token JWT
        const secret = process.env.JWT_SECRET;
        if (!secret)
            throw new Error('JWT_SECRET no definido en variables de entorno');
        const token = jsonwebtoken_1.default.sign({ id: usuario.id, rol: usuario.rol, nombre: usuario.nombre }, secret, { expiresIn: '8h' } // El token dura una jornada laboral
        );
        return {
            token,
            usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol }
        };
    }
};
