import { Injectable } from "@nestjs/common";
import knex from 'knex'
import * as config from '../../knexfile'

@Injectable()
export class KnexService {
    private db

    constructor(){
        this.db = knex(config.development)
    }

    get connection(){
        return this.db
    }
}