import { Injectable, NotFoundException, PipeTransform } from "@nestjs/common";
import { KnexService } from "src/database/knex.service";

@Injectable()
export class ValidateFormExist implements PipeTransform{
    constructor(private knexService: KnexService) {}
    async transform(value: any) {
        const id = Number(value)
        const get = await this.knexService.connection("forms").select("id").where("id", id).first()
        if(!get) throw new NotFoundException("Form Tidak Ada")
        return id
    }
}