import { Injectable, NotFoundException } from '@nestjs/common';
import { KnexService } from 'src/database/knex.service';

@Injectable()
export class KategoriService {
    constructor(private knexService: KnexService) {}

    async getPrimaryKategori(){
        const get = await this.knexService.connection("primary_kategori").select("*")

        return {
            message: "Berhasil Mendapatkan Primary Kategori",
            data: get
        }
    }

    async getSubKategoriById(sub_id: number){
        const get = await this.knexService.connection("sub_kategori")
        .innerJoin("primary_kategori", "primary_kategori.id", "sub_kategori.primary_kategori_id")
        .select({
            primary_kategori: "primary_kategori.name",
            sub_kategori: "sub_kategori.name"
        })
        .where({"sub_kategori.id": sub_id }).first()

        
        if(!get) throw new NotFoundException("Kategori Tidak Ada")

        return get
    }

    async getSubKategori(primary_id: number){
        const get = await this.knexService.connection("sub_kategori")
        .select("id", "name")
        .where({primary_kategori_id: primary_id})

        return {
            message: "Berhasil Mendapatkan Sub Kategori",
            data: get
        }
    }
}
