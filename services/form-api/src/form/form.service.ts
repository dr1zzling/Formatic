import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common'
import { KnexService } from 'src/database/knex.service'
import { SubmitService } from '../submit/submit.service'
import { SoalService } from 'src/soal/soal.service'
const slugify = require('slugify')

@Injectable()
export class FormService {
  constructor(private knexService: KnexService, private submitService: SubmitService, private soalService: SoalService) { }

  async getAll() {
    const get = await this.knexService.connection('forms')
      .join('category', 'category.id', 'forms.category_id')
      .select({
        id: 'forms.id',
        form_title: 'forms.title',
        form_slug: 'forms.slug',
        form_status: 'forms.status',
        form_banner: 'forms.banner',
        category_id: 'category.id',
        category: 'category.category_name',
      })
      .limit(10)
      .offset(0)

    if (get.length === 0) throw new NotFoundException('Tidak Ada Form Dari Category Tersebut')

    return {
      message: 'Berhasil Mendapatkan Seluruh Form',
      data: get,
    }
  }
  // Get All For Development
  async getAllByCategory(category: string) {
    const get = await this.knexService.connection('forms')
      .join('category', 'category.id', 'forms.category_id')
      .select({
        id: 'forms.id',
        form_title: 'forms.title',
        form_slug: 'forms.slug',
        form_status: 'forms.status',
        form_banner: 'forms.banner',
        category_id: 'category.id',
        category: 'category.category_name',
      })
      .limit(10)
      .offset(0)
      .where('category.category_name', category)

    if (get.length === 0) throw new NotFoundException('Tidak Ada Form Dari Category Tersebut')

    return {
      message: 'Berhasil Mendapatkan Seluruh Form',
      data: get,
    }
  }

  // Get By Slug
  async getFormBySlug(slug: string) {
    const get = await this.knexService.connection('forms')
      .leftJoin('category', 'category.id', 'forms.category_id')
      .leftJoin('soal', 'soal.form_id', 'forms.id')
      .leftJoin('soal_option', 'soal_option.soal_id', 'soal.id')
      .leftJoin('option_value', 'option_value.id', 'soal_option.option_value_id')
      .select({
        form_id: 'forms.id',
        form_title: 'forms.title',
        form_banner: 'forms.banner',
        category: 'category.category_name',

        soal_id: 'soal.id',
        soal_question: 'soal.question',
        soal_type: 'soal.type',

        option_id: 'soal_option.id',
        option_value: 'option_value.value',
        option_value_id: 'option_value.id',
        is_correct: 'soal_option.is_correct',
      })
      .where('forms.slug', slug)

    if (get.length === 0) throw new NotFoundException('Maaf, Form Yang Kamu Tuju Tidak Ada')

    // List Soal
    const list_soal = await this.soalService.getSoalByForm(Number(get[0].form_id))

    return {
      message: 'Berhasil Mendapatkan Form',
      data: {
        form_id: get[0].form_id,
        form_title: get[0].form_title,
        form_banner: get[0].form_banner,
        category: get[0].category,
        soal: list_soal,
      },
    }
  }

  // Get All My Form
  async getMyForm(data: { id: number, username: string }) {
    const get = await this.knexService.connection('user_form')
      .leftJoin('forms', 'forms.id', 'form_id')
      .leftJoin('category', 'category.id', 'forms.category_id')
      .select({
        id: 'user_form.id',
        user_id: 'user_form.user_id',
        access_type: 'user_form.access_type',

        form_id: 'forms.id',
        form_slug: 'forms.slug',
        form_title: 'forms.title',
        form_status: 'forms.status',
        form_banner: 'forms.banner',
        category: 'category.category_name',
      })
      .where('user_form.user_id', data.id)

    return {
      message: 'Berhasil Mendapatkan Form Yang Anda Terlibat',
      data: {
        user_id: data.id,
        username: data.username,
        form: get.map((e) => ({
          form_id: e.form_id,
          form_title: e.form_title,
          form_slug: e.form_slug,
          form_status: e.form_status,
          form_banner: e.form_banner,
          access_type: e.access_type,
          category: e.category,
        })),
      },
    }
  }

  // Create Form
  async create(req: { id: number, username: string }, title: string, category_id: number, banner?: string | Express.Multer.File) {
    const slug = slugify(title, { lower: true, strict: true })
    const finalSlug = slug + '-' + Date.now()

    const bannerPath = typeof banner === 'string'
      ? banner
      : banner && typeof banner === 'object' && 'filename' in banner
        ? `/uploads/${banner.filename}`
        : null

    const createForm = await this.knexService.connection.transaction(async (trx) => {
      let fileUploadId: number | null = null

      if (bannerPath) {
        const [insertedFile] = await trx('file_upload')
          .insert({ file_path: bannerPath })
          .returning('id')

        fileUploadId = typeof insertedFile === 'object' ? insertedFile.id : insertedFile
      }

      const [createdForm] = await trx('forms')
        .insert({
          title,
          slug: finalSlug,
          status: 'private',
          category_id,
          banner: bannerPath,
        })
        .returning('*')

      const [createUserForm] = await trx('user_form')
        .insert({ user_id: req.id, form_id: createdForm.id, access_type: 'Creator' })
        .returning('id')

      return { createdForm, createUserForm, fileUploadId }
    })

    const get = await this.knexService.connection('user_form')
      .leftJoin('forms', 'forms.id', 'form_id')
      .leftJoin('category', 'category.id', 'forms.category_id')
      .select({
        id: 'user_form.id',
        user_id: 'user_form.user_id',
        access_type: 'user_form.access_type',
        form_id: 'forms.id',
        form_slug: 'forms.slug',
        form_title: 'forms.title',
        form_status: 'forms.status',
        form_banner: 'forms.banner',
        category: 'category.category_name',
      })
      .where('user_form.id', createForm.createUserForm.id)
      .first()

    return {
      message: 'Berhasil Membuat Form',
      data: {
        user: {
          user_id: req.id,
          username: req.username,
          access_type: get.access_type,
        },
        form: {
          form_id: get.form_id,
          form_title: get.form_title,
          form_slug: get.form_slug,
          form_status: get.form_status,
          form_banner: get.form_banner,
          category: get.category,
        },
      },
    }
  }

  // Update Form Public
  async updateForm(req: {id: number, username: string}, form_id: number, status: string){
    const isCreator = await this.knexService.connection("user_form")
    .select("access_type")
    .where({user_id: req.id, form_id: form_id})
    .first()

    if(!isCreator || isCreator.access_type == "Collaborator") throw new UnauthorizedException("Anda Tidak Berhak Menghapus Form Ini")
    
    const [updateToPublic] = await this.knexService.connection("forms")
    .update("status", status)
    .where("id", form_id)

    return {
      message: `Berhasil Mengubah ke ${status}`
    }
  }

  // Delete Form
  async deleteForm(req: { id: number, username: string }, form_id: number) {
    const isCreator = await this.knexService.connection("user_form")
    .select("access_type")
    .where({user_id: req.id, form_id: form_id})
    .first()

    if(!isCreator || isCreator.access_type == "Collaborator") throw new UnauthorizedException("Anda Tidak Berhak Menghapus Form Ini")
    const deleteForm = await this.knexService.connection("forms")
    .delete()
    .where(form_id)

    return {
      message: "Berhasil Menghapus" 
    }
  }

  // Get My Submit History
  async getMySubmitForm(req: { id: number, username: string }, form_id: number) {
    return this.submitService.getMySubmitForm(req, form_id)
  }

  async getAllRespon(req: { id: number, username: string }, form_id: number) {
    return this.submitService.getAllSubmitByForm(req, form_id)
  }

  async createSubmit(req: { id: number, username: string }, form_id: number, body: any) {
    return this.submitService.createSubmitForm(req, form_id, body)
  }
}
