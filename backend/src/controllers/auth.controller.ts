import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';

export const AuthController = {
    async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ error: 'Email y contraseña son requeridos' });
            }

            const resultado = await AuthService.login(email, password);
            res.status(200).json(resultado);

        } catch (error: any) {
            res.status(401).json({ error: error.message });
        }
    }
};