"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const visita_routes_1 = __importDefault(require("./routes/visita.routes"));
const gestor_routes_1 = __importDefault(require("./routes/gestor.routes"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const diaInhabil_routes_1 = __importDefault(require("./routes/diaInhabil.routes"));
const configuracion_routes_1 = __importDefault(require("./routes/configuracion.routes"));
const usuario_routes_1 = __importDefault(require("./routes/usuario.routes"));
const estadisticas_routes_1 = __importDefault(require("./routes/estadisticas.routes"));
const auditoria_routes_1 = __importDefault(require("./routes/auditoria.routes"));
const institucion_routes_1 = __importDefault(require("./routes/institucion.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Middlewares
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express_1.default.json());
app.use('/api/auth', auth_routes_1.default);
app.use('/api/visitas', visita_routes_1.default);
app.use('/api/gestores', gestor_routes_1.default);
app.use('/api/dias-inhabiles', diaInhabil_routes_1.default);
app.use('/api/configuracion', configuracion_routes_1.default);
app.use('/api/usuarios', usuario_routes_1.default);
app.use('/api/estadisticas', estadisticas_routes_1.default);
app.use('/api/auditoria', auditoria_routes_1.default);
app.use('/api/instituciones', institucion_routes_1.default);
// Ruta de prueba
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'API del Túnel Subfluvial funcionando' });
});
// Middleware de manejo de errores global
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err, req, res, _next) => {
    console.error('[Error Global]', err.message);
    res.status(500).json({ error: err.message || 'Error interno del servidor' });
});
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
