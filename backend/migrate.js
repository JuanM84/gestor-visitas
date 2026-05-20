const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'tunel_subfluvial',
    password: process.env.DB_PASSWORD || 'tu_contraseña',
    port: parseInt(process.env.DB_PORT || '5432'),
});

async function migrate() {
    try {
        console.log('🔄 Iniciando migración...');
        
        // Verificar si la columna ya existe
        const checkColumn = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'Gestor' AND column_name = 'tipo'
        `);
        
        if (checkColumn.rows.length > 0) {
            console.log('✅ La columna "tipo" ya existe en la tabla Gestor');
        } else {
            // Agregar la columna si no existe
            await pool.query(`
                ALTER TABLE Gestor 
                ADD COLUMN tipo VARCHAR(50) DEFAULT 'Institución Educativa'
            `);
            console.log('✅ Columna "tipo" agregada exitosamente a la tabla Gestor');
        }
        
        // Mostrar la estructura de la tabla
        const tableInfo = await pool.query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'Gestor'
            ORDER BY ordinal_position
        `);
        
        console.log('\n📋 Estructura actual de la tabla Gestor:');
        tableInfo.rows.forEach(row => {
            console.log(`   - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? '(NOT NULL)' : '(nullable)'}`);
        });
        
        process.exit(0);
    } catch (err) {
        console.error('❌ Error durante la migración:', err.message);
        process.exit(1);
    }
}

migrate();
