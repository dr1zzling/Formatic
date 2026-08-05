import { ArgumentMetadata, Injectable, NotFoundException, PipeTransform } from "@nestjs/common";
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

@Injectable()
export class ValidateCategoryExistByName implements PipeTransform{
    constructor(private knexService: KnexService) {}
    async transform(value: string) {
        const lower = value.toLowerCase()
        const kapital = value.charAt(0).toUpperCase() + lower.slice(1) 

        const exist = await this.knexService.connection("category").select("id").where("category_name", kapital).first()
        if(!exist) throw new NotFoundException("Category Tidak Ada")

        return kapital
    }
}