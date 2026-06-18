import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
    usuario?: any;
}

export const verificarToken = (req: AuthRequest, res: Response, next: NextFunction) => {
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
        const decoded = jwt.verify(token, secret);
        req.usuario = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            error: 'Token inválido o expirado. Por favor, inicie sesión nuevamente.'
        });
    }
};

export const verificarRol = (rolesPermitidos: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const usuario = (req as AuthRequest).usuario;

        if (!usuario || !rolesPermitidos.includes(usuario.rol)) {
            return res.status(403).json({
                error: 'Acceso denegado. No tienes permisos suficientes para realizar esta acción.'
            });
        }
        next();
    };
};