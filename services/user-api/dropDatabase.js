const { pg } = require("./database/db")

async function deleteUserDB(){
    try{
        await pg.query(`
          DROP DATABASE IF EXISTS user_db
        `)

        console.log("berhasil")
    }
    catch(err){
        console.log(err)
    }
    finally{
        process.exit(0)
    }
}

deleteUserDB()