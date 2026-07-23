const createUser_db = require("./database/createDB")
const createUserDatabase = require("./database/table/userTable")

async function migrate(){
    try{
        await createUser_db()
        await createUserDatabase()
    }
    catch(err){
        console.log(err)
    }
    finally{
        process.exit(0)
    }
}

migrate()