import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
    usuario?: any;
}

export const verificarToken = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const headerToken = authHeader && authHeader.split(' ')[1];

    const queryToken = req.query.token as string;

    const token = headerToken || queryToken;

    if (!token) {
        return res.status(401).json({
            error: 'Acceso denegado. Se requiere un token de autenticación.'
        });
    }

    try {
        const secret = process.env.JWT_SECRET || 'secreto_fallback';
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
        const usuario = (req as any).usuario;

        if (!usuario || !rolesPermitidos.includes(usuario.rol)) {
            return res.status(403).json({
                error: 'Acceso denegado. No tienes permisos suficientes para realizar esta acción.'
            });
        }
        next();
    };
};