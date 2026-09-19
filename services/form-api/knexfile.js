// Update with your config settings.
require("dotenv").config()
/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
module.exports = {

  development: {
    client: 'pg',
    connection: {
      database: process.env.DB_NAME_FORM || 'postgres',
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 6543,
      ssl: { rejectUnauthorized: false }
    },
    migrations: {
      directory: './migration'
    },
    seeds: {
      directory: './seeder'
    }
  },

  production: {
    client: 'pg',
    connection: {
      database: process.env.DB_NAME_FORM || 'postgres',
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 6543,
      ssl: { rejectUnauthorized: false }
    },
    migrations: {
      directory: './migration'
    },
    seeds: {
      directory: './seeder'
    }
  },  

};
