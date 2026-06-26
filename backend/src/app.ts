import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import visitaRoutes from './routes/visita.routes';
import gestorRoutes from './routes/gestor.routes';
import authRoutes from './routes/auth.routes';
import diaInhabilRoutes from './routes/diaInhabil.routes';
import configuracionRoutes from './routes/configuracion.routes';
import usuarioRoutes from './routes/usuario.routes';
import estadisticasRoutes from './routes/estadisticas.routes';
import auditoriaRoutes from './routes/auditoria.routes';
import institucionRoutes from './routes/institucion.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Documentación Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/auth', authRoutes);
app.use('/api/visitas', visitaRoutes);
app.use('/api/gestores', gestorRoutes);
app.use('/api/dias-inhabiles', diaInhabilRoutes);
app.use('/api/configuracion', configuracionRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/estadisticas', estadisticasRoutes);
app.use('/api/auditoria', auditoriaRoutes);
app.use('/api/instituciones', institucionRoutes);

// Ruta de prueba
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'API del Túnel Subfluvial funcionando' });
});

// Middleware de manejo de errores global
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
    console.error('[Error Global]', err.message);
    res.status(500).json({ error: err.message || 'Error interno del servidor' });
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});