import { Injectable } from '@nestjs/common';
import { KnexService } from 'src/database/knex.service';

@Injectable()
export class CategoryService {
    constructor(private knexService: KnexService) {}

    // Get All Category
    async getAll(){
        const get = await this.knexService.connection("category").select("*")

        return {
            message : "Berhasil Mendapatkan Category",
            data: get
        }
    }
}