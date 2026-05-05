import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import visitaRoutes from './routes/visita.routes';
import gestorRoutes from './routes/gestor.routes';
import authRoutes from './routes/auth.routes';
import diaInhabilRoutes from './routes/diaInhabil.routes';
import configuracionRoutes from './routes/configuracion.routes';
import usuarioRoutes from './routes/usuario.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/visitas', visitaRoutes);
app.use('/api/gestores', gestorRoutes);
app.use('/api/dias-inhabiles', diaInhabilRoutes);
app.use('/api/configuracion', configuracionRoutes);
app.use('/api/usuarios', usuarioRoutes);

// Ruta de prueba
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'API del Túnel Subfluvial funcionando' });
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});