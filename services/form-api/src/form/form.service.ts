import { Injectable } from '@nestjs/common';
import { KnexService } from 'src/database/knex.service';
const slugify = require("slugify")

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

    // Create Form
    async create(req: {id: number, username: string}, data: {title: string}){
        const slug = slugify(data.title, { lower: true, strict: true})
        const finalSlug = slug + '-' + Date.now()

        const [createForm] = await this.knexService.connection("forms")
        .insert({ title: data.title, slug: finalSlug, status: "private"})
        .returning("*")
        
        const [createUserForm] = await this.knexService.connection("user_form")
        .insert({ user_id: req.id, form_id: createForm.id, access_type: "Creator"})
        .returning("id")

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
        .where("user_form.id", createUserForm.id)
        .first()

        return {
            message: "Berhasil Membuat Form",
            data: {
                id: get.id,
                user: {
                    user_id: req.id,
                    username: req.username,
                    access_type: get.access_type
                },
                form: {
                    form_id: get.form_id,
                    form_title: get.form_title,
                    form_slug: get.form_slug,
                    form_status: get.form_title
                }
            }
        }
    }

    // Get All By User
    async getUserForm(data: {id: number, username: string}){
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