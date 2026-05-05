import { Request, Response } from 'express';
import { UsuarioService } from '../services/usuario.service';

export const UsuarioController = {
    async getUsuarios(req: Request, res: Response) {
        try {
            const usuarios = await UsuarioService.obtenerTodos();
            res.status(200).json(usuarios);
        } catch (error: any) {
            res.status(500).json({ error: 'Error al obtener usuarios' });
        }
    },

    async crearUsuario(req: Request, res: Response) {
        try {
            const nuevoUsuario = await UsuarioService.crearUsuario(req.body);
            res.status(201).json({ mensaje: 'Usuario creado exitosamente', usuario: nuevoUsuario });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }
};