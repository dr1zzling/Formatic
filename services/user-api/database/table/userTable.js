const { pool } = require("../db")

async function createUserDatabase() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users(
            id SERIAL PRIMARY KEY,
            username VARCHAR,
            password TEXT,
            token TEXT
        )    
        `)

        console.log("Berhasil Membuat Table User")
    }
    catch (err) {
        console.log(err)
    }
}

module.exports = createUserDatabase