import { Injectable } from '@nestjs/common';
import { KnexService } from 'src/database/knex.service';

@Injectable()
export class FormService {
    constructor(private knexService: KnexService) {}

    // Get All For Development 
    async getAll(){
        const get = await this.knexService.connection("forms").select("*")

        return {
            message: "Berhasil Mendapatkan Seluruh Form",
            data: get
        }
    }

    // Get All By User
    async getUserForm(data: {id: number, username: string}){
        console.log(data.id)
        const get = await this.knexService.connection("user_form")
        .leftJoin("forms", "forms.id", "form_id")
        .select({
            id: "user_form.id",
            user_id: "user_form.user_id",
            access_type: "user_form.access_type",

            form_id: "forms.id",
            form_slug: "forms.slug",
            form_title: "forms.title",
            form_status: "forms.status"
        })
        .where("user_form.user_id", data.id)

        return {
            message: "Berhasil Mendapatkan Form Yang Anda Terlibat",
            data: {
                user_id: data.id,
                username: data.username,
                form: get.map((e) => ({
                    form_id: e.form_id,
                    form_title: e.form_title,
                    form_slug: e.form_slug,
                    form_status: e.form_status,
                    access_type: e.access_type
                }))
            }
        }
    }
}