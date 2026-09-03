const { Pool } = require("pg")
require("dotenv").config()

const pg = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: "postgres",
    ssl: { rejectUnauthorized: false },
    port: process.env.DB_PORT || 6543
})

const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false },
    port: process.env.DB_PORT || 6543,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
})

module.exports = { pg, pool }