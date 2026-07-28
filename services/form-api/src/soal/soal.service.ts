import { Injectable } from '@nestjs/common';
import { KnexService } from 'src/database/knex.service';

@Injectable()
export class SoalService {
    constructor(private knexService: KnexService) {}

    async getSoalByForm(id: number){
        const get = await this.knexService.connection("soal")
        .leftJoin("forms", "forms.id", "soal.form_id")
        .select({
            id: "soal.id",
            question: "soal.question",
            form_id: "forms.id",
            form_title: "forms.title" 
        })
        .where("forms.id", id)

        return {
            message: "Berhasil Mendapatkan Soal",
            data: {
                form_id: get[0].form_id,
                form_title: get[0].form_title,
                soal: get.map((e) => ({
                    id: e.id,
                    question: e.question
                }))
            }
        }
    }
}
