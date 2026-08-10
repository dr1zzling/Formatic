import { Injectable, UnauthorizedException } from "@nestjs/common"
import { KnexService } from "src/database/knex.service"

@Injectable()
export class ValidateIsCreator {
    constructor(private knexService: KnexService) { }

    async isCreator(id: number, form_id) {
        const isCreator = await this.knexService.connection("user_form")
            .select("access_type")
            .where({ user_id: id, form_id: form_id })
            .first()

        if (!isCreator || isCreator.access_type == "Collaborator") throw new UnauthorizedException("Anda Tidak Berhak Dengan Form Ini")
    }
}