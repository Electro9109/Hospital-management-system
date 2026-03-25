const oracledb = require('oracledb');
require('dotenv').config();

// Use Thin mode (no Oracle Instant Client needed for oracledb 6+)
// If you're on older oracledb, comment this out and use Thick mode
// oracledb.initOracleClient({ libDir: 'C:\\oracle\\instantclient_21_3' });

let pool;

async function initialize() {
    try {
        pool = await oracledb.createPool({
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            connectString: process.env.DB_CONNECT_STRING,
            poolMin: 2,
            poolMax: 10,
            poolIncrement: 1
        });
        console.log('✅ Oracle DB connection pool created');
    } catch (err) {
        console.error('❌ Oracle DB connection failed:', err);
        throw err;
    }
}

async function getConnection() {
    return await pool.getConnection();
}

async function execute(sql, binds = [], options = {}) {
    let connection;
    try {
        connection = await getConnection();
        const result = await connection.execute(sql, binds, {
            outFormat: oracledb.OUT_FORMAT_OBJECT,
            autoCommit: true,
            ...options
        });
        return result;
    } catch (err) {
        console.error('DB Error:', err);
        throw err;
    } finally {
        if (connection) {
            try { await connection.close(); } catch (e) { /* ignore */ }
        }
    }
}

async function close() {
    if (pool) {
        await pool.close(0);
        console.log('Oracle DB pool closed');
    }
}

module.exports = { initialize, getConnection, execute, close };
