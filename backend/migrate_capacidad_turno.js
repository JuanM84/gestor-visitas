/**
 * Migración: Agrega el parámetro 'capacidad_por_turno' en la tabla Configuracion.
 * Valor por defecto: 80 personas por turno.
 * Es idempotente: si ya existe, no hace nada.
 */

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
        console.log('🔄 Iniciando migración: capacidad_por_turno...');

        // Verificar si el parámetro ya existe
        const check = await pool.query(
            "SELECT clave, valor FROM Configuracion WHERE clave = 'capacidad_por_turno'"
        );

        if (check.rows.length > 0) {
            console.log(`✅ El parámetro 'capacidad_por_turno' ya existe con valor: ${check.rows[0].valor}`);
        } else {
            await pool.query(
                "INSERT INTO Configuracion (clave, valor) VALUES ('capacidad_por_turno', '80')"
            );
            console.log("✅ Parámetro 'capacidad_por_turno' insertado con valor por defecto: 80");
        }

        // Mostrar el estado actual de la tabla Configuracion
        const all = await pool.query('SELECT clave, valor FROM Configuracion ORDER BY clave');
        console.log('\n📋 Parámetros actuales en Configuracion:');
        all.rows.forEach(row => {
            console.log(`   - ${row.clave}: ${row.valor}`);
        });

        process.exit(0);
    } catch (err) {
        console.error('❌ Error durante la migración:', err.message);
        process.exit(1);
    }
}

migrate();
