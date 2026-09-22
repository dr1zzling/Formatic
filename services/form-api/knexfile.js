require("dotenv").config()
/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */

const sslConfig = process.env.ENV_MODE === 'development' ? { rejectUnauthorized: false } : false
module.exports = {

  development: {
    client: 'pg',
    connection: {
      database: process.env.DB_NAME_FORM || 'postgres',
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 6543,
      ssl: sslConfig
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
      ssl: sslConfig
    },
    migrations: {
      directory: './migration'
    },
    seeds: {
      directory: './seeder'
    }
  },  

};
