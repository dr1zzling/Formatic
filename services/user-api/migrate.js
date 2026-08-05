const { pool, pg } = require("./db")
const bcrypt = require("bcrypt")

async function migrate() {
    try {

        // Create Database user_db
        await pg.query(`
            CREATE DATABASE user_db
            `)
        console.log("Berhasil Membuat User DB")

        // Create Table User
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users(
            id SERIAL PRIMARY KEY,
            username VARCHAR,
            password TEXT
        )    
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