import { Injectable } from "@nestjs/common";
import knex from 'knex'
import * as config from '../../knexfile'

@Injectable()
export class KnexService {
    private db
    private userDb

    constructor(){
        const baseConn = {
            ...config.production.connection,
            database: process.env.DB_NAME_FORM || 'postgres',
            ssl: { rejectUnauthorized: false },
        }
        this.db = knex({
            ...config.production,
            connection: baseConn,
        })
        this.userDb = knex({
            ...config.production,
            connection: {
                ...baseConn,
                database: process.env.DB_NAME_USER || process.env.DB_NAME_FORM || 'postgres',
            }
        })
    }

    get connection(){
        return this.db
    }

    get userConnection(){
        return this.userDb
    }
}