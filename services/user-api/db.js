const { Pool } = require("pg")
require("dotenv").config()

const pg = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: "postgres",
    ssl: { rejectUnauthorized: false },
    port: process.env.DB_PORT || 6543
})

const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false },
    port: process.env.DB_PORT || 6543
})

module.exports = {pg, pool}