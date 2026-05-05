const { Pool } = require('pg');
const pool = new Pool({
  user: 'postgres',
  host: '127.0.0.1',
  database: 'tunel_subfluvial',
  password: 'admin123',
  port: 5433
});

pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'gestor'")
  .then(res => { console.log(res.rows); pool.end(); })
  .catch(err => { console.error(err); pool.end(); });
