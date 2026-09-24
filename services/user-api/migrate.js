const { pool, pg } = require("./db")
const bcrypt = require("bcrypt")

async function migrate() {
    try {

        // Create Database user_db
        await pg.query(`
            CREATE DATABASE formatic_user
            `)
        console.log("Berhasil Membuat User DB")

        await pg.query(`
            CREATE DATABASE formatic_form
        `)
        console.log("Berhasil Membuat Form DB")

        // Create Table User
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users(
            id SERIAL PRIMARY KEY,
            username VARCHAR,
            email VARCHAR,
            password TEXT
        )    
        `)

        // PERBAIKAN: tabel bisa al bestaan zonder `email` kolom (voorgaande
        // migraties). Voeg de kolom idempotent toe zodat OTP-verificatie
        // (register/login, beide vereisen `email`) blijft werken.
        await pool.query(`
            ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR
        `)
        console.log("Berhasil Membuat Table User")

        const userModel = [
            {
                username: "fadhil hebat", 
                password: "fadhil123"
            },
            {
                username: "erzy mantap", 
                password: "erzy123"
            },
            {
                username: "abdi coy",
                password: "abdi123"
            }
        ]

        for (let user of userModel) {
            const hashPassword = await bcrypt.hash(user.password, 10)
            await pool.query(`
                INSERT INTO users (username, password) VALUES ($1, $2)
            `, [user.username, hashPassword])
        }

        console.log("Berhasil Membuat Seeder User")
    }
    catch (err) {
        console.log(err)
    }
    finally {
        process.exit(0)
    }
}

migrate()