import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Si existe DATABASE_URL (ej. en Render), usamos la URL completa y habilitamos SSL
const poolConfig = process.env.DATABASE_URL 
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
      }
    : {
        // Configuración para tu entorno local
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'tunel_subfluvial',
        password: process.env.DB_PASSWORD || 'tu_contraseña',
        port: parseInt(process.env.DB_PORT || '5432'),
      };

export const pool = new Pool(poolConfig);

// Comprobación inicial de la conexión
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ Error conectando a PostgreSQL', err.message);
    } else {
        console.log('✅ Conectado a PostgreSQL exitosamente');
    }
});