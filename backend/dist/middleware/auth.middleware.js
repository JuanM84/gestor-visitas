"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verificarRol = exports.verificarToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const verificarToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({
            error: 'Acceso denegado. Se requiere un token de autenticación.'
        });
    }
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        console.error('FATAL: JWT_SECRET no está definido en las variables de entorno.');
        return res.status(500).json({ error: 'Error de configuración del servidor.' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        req.usuario = decoded;
        next();
    }
    catch (error) {
        return res.status(401).json({
            error: 'Token inválido o expirado. Por favor, inicie sesión nuevamente.'
        });
    }
};
exports.verificarToken = verificarToken;
const verificarRol = (rolesPermitidos) => {
    return (req, res, next) => {
        const usuario = req.usuario;
        if (!usuario || !rolesPermitidos.includes(usuario.rol)) {
            return res.status(403).json({
                error: 'Acceso denegado. No tienes permisos suficientes para realizar esta acción.'
            });
        }
        next();
    };
};
exports.verificarRol = verificarRol;
