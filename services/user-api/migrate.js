const { pool, pg } = require("./db")

async function migrate(){
    try{

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
            password TEXT,
            token TEXT
        )    
        `)
        console.log("Berhasil Membuat Table User")

    }
    catch(err){
        console.log(err)
    }
    finally{
        process.exit(0)
    }
}

migrate()