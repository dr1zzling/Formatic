import { BadRequestException, Injectable, NotFoundException, PipeTransform } from "@nestjs/common";
import { KnexService } from "../database/knex.service";

@Injectable()
export class ValidateFormExist implements PipeTransform{
    constructor(private knexService: KnexService) {}
    async transform(value: any) {
        if(!value) throw new BadRequestException("Isi Yang Benar")
        const get = await this.knexService.connection("forms").select("*").where("slug", value).first()
        if(!get) throw new NotFoundException("Form Tidak Ada")
        return get
    }
}