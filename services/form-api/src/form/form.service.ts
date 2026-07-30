import { Injectable, NotFoundException } from '@nestjs/common';
import { KnexService } from 'src/database/knex.service';
const slugify = require("slugify")

@Injectable()
export class FormService {
    constructor(private knexService: KnexService) {}

    // Get All For Development 
    async getAll(){
        const get = await this.knexService.connection("forms")
        .join("category", "category.id", "forms.category_id")
        .select({
            id: "forms.id",
            form_title: "forms.title",
            form_slug: "forms.slug",
            form_status: "forms.status",
            category_id: "category.id",
            category: "category.category_name"
        })

        console.log(get)

        return {
            message: "Berhasil Mendapatkan Seluruh Form",
            data: get
        }
    }

    // Get By Slug
    async getFormBySlug(slug: string){
        const get = await this.knexService.connection("forms")
        .leftJoin("category", "category.id", "forms.category_id")
        .leftJoin("soal", "soal.form_id", "forms.id")
        .leftJoin("soal_option", "soal_option.soal_id", "soal.id")
        .leftJoin("option_value", "option_value.id", "soal_option.option_value_id")
        .select({
            form_id: "forms.id",
            form_title: "forms.title",
            category: "category.category_name",

            soal_id: "soal.id",
            soal_question: "soal.question",
            soal_type: "soal.type",

            option_id: "soal_option.id",
            option_value: "option_value.value",
            option_value_id: "option_value.id",
            is_correct: "soal_option.is_correct",
        })
        .where("forms.slug", slug)

        console.log(get)

        if(get.length === 0) throw new NotFoundException("Maaf, Form Yang Kamu Tuju Tidak Ada")
        

        return {
            message: "Berhasil Mendapatkan Form",
            data: {
                form_id: get[0].form_id,
                form_title: get[0].form_title,
                category: get[0].category,
                soal: ""
            }
        }
    }

    // Get All My Form
    async getMyForm(data: {id: number, username: string}){
        const get = await this.knexService.connection("user_form")
        .leftJoin("forms", "forms.id", "form_id")
        .leftJoin("category", "category.id", "forms.category_id")
        .select({
            id: "user_form.id",
            user_id: "user_form.user_id",
            access_type: "user_form.access_type",

            form_id: "forms.id",
            form_slug: "forms.slug",
            form_title: "forms.title",
            form_status: "forms.status",
            category: "category.category_name"
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
                    access_type: e.access_type,
                    category: e.category
                }))
            }
        }
    }

    // Create Form
    async create(req: {id: number, username: string}, title: string, category_id: number){
        const slug = slugify(title, { lower: true, strict: true})
        const finalSlug = slug + '-' + Date.now()

        const [createForm] = await this.knexService.connection("forms")
        .insert({ title: title, slug: finalSlug, status: "private", category_id: category_id})
        .returning("*")
        
        const [createUserForm] = await this.knexService.connection("user_form")
        .insert({ user_id: req.id, form_id: createForm.id, access_type: "Creator"})
        .returning("id")

        const get = await this.knexService.connection("user_form")
        .leftJoin("forms", "forms.id", "form_id")
        .leftJoin("category", "category.id", "forms.category_id")
        .select({
            id: "user_form.id",
            user_id: "user_form.user_id",
            access_type: "user_form.access_type",
            form_id: "forms.id",
            form_slug: "forms.slug",
            form_title: "forms.title",
            form_status: "forms.status",
            category: "category.category_name"
        })
        .where("user_form.id", createUserForm.id)
        .first()

        return {
            message: "Berhasil Membuat Form",
            data: {
                user: {
                    user_id: req.id,
                    username: req.username,
                    access_type: get.access_type
                },
                form: {
                    form_id: get.form_id,
                    form_title: get.form_title,
                    form_slug: get.form_slug,
                    form_status: get.form_title,
                    category: get.category
                }
            }
        }
    }


}