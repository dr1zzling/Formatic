// Update with your config settings.
require("dotenv").config()
/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
module.exports = {

  development: {
    client: 'pg',
    connection: {
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      // ssl: { rejectUnauthorized: false }
    },
    migrations: {
      directory: './migration'
    },
    seeds: {
      directory: './seeder'
    }
  },

};
