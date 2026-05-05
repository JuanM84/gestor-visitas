import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'tunel_subfluvial',
    password: process.env.DB_PASSWORD || 'tu_contraseña',
    port: parseInt(process.env.DB_PORT || '5432'),
});

// Comprobación inicial de la conexión
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ Error conectando a PostgreSQL', err.stack);
    } else {
        console.log('✅ Conectado a PostgreSQL exitosamente');
    }
});