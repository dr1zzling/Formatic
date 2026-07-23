const { pg } = require('./db')

async function createUser_db() {
    try {
        await pg.query(`
            CREATE DATABASE user_db
            `)
        console.log("Berhasil Membuat User DB")
    }
    catch (error) {
        console.log(error)
    }
}

module.exports = createUser_db