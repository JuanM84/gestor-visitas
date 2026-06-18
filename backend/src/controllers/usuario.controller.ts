import { Request, Response } from 'express';
import { UsuarioService } from '../services/usuario.service';
import { AuthRequest } from '../middleware/auth.middleware';

export const UsuarioController = {
    async getUsuarios(req: Request, res: Response) {
        try {
            const usuarios = await UsuarioService.obtenerTodos();
            res.status(200).json(usuarios);
        } catch (error: any) {
            res.status(500).json({ error: 'Error al obtener usuarios' });
        }
    },

    async crearUsuario(req: AuthRequest, res: Response) {
        try {
            const usuarioId = req.usuario?.id;
            const nuevoUsuario = await UsuarioService.crearUsuario(req.body, usuarioId);
            res.status(201).json({ mensaje: 'Usuario creado exitosamente', usuario: nuevoUsuario });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    },

    // U-8: Desactivar usuario (soft-delete con protección del último Admin)
    async desactivarUsuario(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const usuarioSolicitante = req.usuario;

            // Un usuario no puede desactivarse a sí mismo
            if (String(usuarioSolicitante.id) === String(id)) {
                return res.status(400).json({ error: 'No podés desactivar tu propia cuenta mientras tenés la sesión activa.' });
            }

            const usuario = await UsuarioService.desactivarUsuario(String(id), usuarioSolicitante.id);
            res.status(200).json({ mensaje: `Usuario "${usuario.nombre}" desactivado correctamente`, usuario });
        } catch (error: any) {
            const status = error.message.includes('no encontrado') ? 404 : 400;
            res.status(status).json({ error: error.message });
        }
    },

    // Reactivar usuario (solo Admin)
    async reactivarUsuario(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const usuarioSolicitante = req.usuario;
            const usuario = await UsuarioService.reactivarUsuario(String(id), usuarioSolicitante.id);
            res.status(200).json({ mensaje: `Usuario "${usuario.nombre}" reactivado correctamente`, usuario });
        } catch (error: any) {
            const status = error.message.includes('no encontrado') ? 404 : 400;
            res.status(status).json({ error: error.message });
        }
    },

    // Actualizar datos de usuario (Admin)
    async actualizarDatos(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const { nombre, email, telefono, rol } = req.body;
            const usuarioSolicitante = req.usuario;
            const usuario = await UsuarioService.actualizarDatos(String(id), { nombre, email, telefono, rol }, usuarioSolicitante.id);
            res.status(200).json({ mensaje: 'Usuario actualizado correctamente.', usuario });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    },

    // A-9: Cambiar contraseña propia
    async cambiarPassword(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const usuarioSolicitante = req.usuario;

            // Solo el propio usuario o un Admin puede cambiar la contraseña
            if (String(usuarioSolicitante.id) !== String(id) && usuarioSolicitante.rol !== 'Admin') {
                return res.status(403).json({ error: 'Solo podés cambiar tu propia contraseña.' });
            }

            const { passwordActual, nuevaPassword } = req.body;
            if (!passwordActual || !nuevaPassword) {
                return res.status(400).json({ error: 'La contraseña actual y la nueva contraseña son obligatorias.' });
            }

            await UsuarioService.cambiarPassword(String(id), passwordActual, nuevaPassword, usuarioSolicitante.id);
            res.status(200).json({ mensaje: 'Contraseña actualizada correctamente.' });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    },

    // Obtener perfil propio
    async obtenerPerfil(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const usuarioSolicitante = req.usuario;
            if (String(usuarioSolicitante.id) !== String(id) && usuarioSolicitante.rol !== 'Admin') {
                return res.status(403).json({ error: 'Solo podés ver tu propio perfil.' });
            }
            const usuario = await UsuarioService.obtenerPorId(String(id));
            res.status(200).json(usuario);
        } catch (error: any) {
            res.status(404).json({ error: error.message });
        }
    },

    // Actualizar perfil propio (email, teléfono)
    async actualizarPerfil(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const usuarioSolicitante = req.usuario;
            if (String(usuarioSolicitante.id) !== String(id)) {
                return res.status(403).json({ error: 'Solo podés editar tu propio perfil.' });
            }
            const { email, telefono } = req.body;
            const usuario = await UsuarioService.actualizarPerfil(String(id), { email, telefono }, usuarioSolicitante.id);
            res.status(200).json({ mensaje: 'Perfil actualizado correctamente.', usuario });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    },
};