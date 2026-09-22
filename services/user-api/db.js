const { Pool } = require("pg")
require("dotenv").config()

const sslConfig = process.env.ENV_MODE === 'development' ? { rejectUnauthorized: false } : false

const pg = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: "postgres",
    ssl: sslConfig,
    port: Number(process.env.DB_PORT) || 6543
})

const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME_USER || "postgres",
    ssl: sslConfig,
    port: Number(process.env.DB_PORT) || 6543,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
})

// Tangkap error koneksi supaya process tidak crash
pg.on('error', (err) => console.error('pg pool error:', err.message))
pool.on('error', (err) => console.error('pool error:', err.message))

module.exports = { pg, pool }
