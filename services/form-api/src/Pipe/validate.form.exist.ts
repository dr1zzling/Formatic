import { Injectable, NotFoundException, PipeTransform } from "@nestjs/common";
import { KnexService } from "src/database/knex.service";

@Injectable()
export class ValidateFormExist implements PipeTransform{
    constructor(private knexService: KnexService) {}
    async transform(value: any) {
        const get = await this.knexService.connection("forms").select("id").where("slug", value).first()
        if(!get) throw new NotFoundException("Form Tidak Ada")
        return get
    }
}