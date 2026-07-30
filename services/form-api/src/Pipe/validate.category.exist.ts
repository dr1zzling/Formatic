import { Injectable, NotFoundException, PipeTransform } from "@nestjs/common";
import { KnexService } from "src/database/knex.service";

@Injectable()
export class ValidateCategoryExist implements PipeTransform{
    constructor(private knexService: KnexService) {}
    async transform(value: any) {
        const id = Number(value)
        const exist = await  this.knexService.connection("category").select("id").where("id", id).first()
        if(!exist) throw new NotFoundException("Category Tidak Ada")
        
        return id
    }
}