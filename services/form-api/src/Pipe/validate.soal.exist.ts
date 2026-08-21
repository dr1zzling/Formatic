import { Injectable, NotFoundException, PipeTransform } from "@nestjs/common";
import { KnexService } from "src/database/knex.service";

@Injectable()
export class ValidateSoalExist implements PipeTransform {
    constructor(private knexService: KnexService){}
    async transform(value: any) {
        const id = Number(value)
        const get = await this.knexService.connection("soal").select("id").where("id", id).first()
        if(!get) throw new NotFoundException("Soal Tidak Ada")

        return id
    }
}