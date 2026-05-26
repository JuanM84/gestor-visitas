"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsuarioController = void 0;
const usuario_service_1 = require("../services/usuario.service");
exports.UsuarioController = {
    async getUsuarios(req, res) {
        try {
            const usuarios = await usuario_service_1.UsuarioService.obtenerTodos();
            res.status(200).json(usuarios);
        }
        catch (error) {
            res.status(500).json({ error: 'Error al obtener usuarios' });
        }
    },
    async crearUsuario(req, res) {
        try {
            const nuevoUsuario = await usuario_service_1.UsuarioService.crearUsuario(req.body);
            res.status(201).json({ mensaje: 'Usuario creado exitosamente', usuario: nuevoUsuario });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
};
