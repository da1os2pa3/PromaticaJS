const mysql = require('mysql2');

// Creamos el grupo (pool) de conexiones con tus credenciales
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'promatica_js',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Prueba para confirmar en la terminal que conectó bien
pool.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Error al conectar a MySQL:', err.message);
        return;
    }
    console.log('✅ Conexión exitosa a la base de datos MySQL (promatica_js)');
    connection.release();
});

// Exportamos el pool para que las rutas lo puedan usar
module.exports = pool;
