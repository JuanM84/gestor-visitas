"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("../services/auth.service");
exports.AuthController = {
    async login(req, res) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({ error: 'Email y contraseña son requeridos' });
            }
            const resultado = await auth_service_1.AuthService.login(email, password);
            res.status(200).json(resultado);
        }
        catch (error) {
            res.status(401).json({ error: error.message });
        }
    }
};
