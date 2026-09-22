const { pg } = require("./db")

async function deleteUserDB(){
    try{
        await pg.query(`
          DROP DATABASE IF EXISTS formatic_user WITH (FORCE)
        `)

        await pg.query(`
          DROP DATABASE IF EXISTS formatic_form WITH (FORCE)
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