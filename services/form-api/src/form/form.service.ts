import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { KnexService } from 'src/database/knex.service';
import { SubmitService } from '../submit/submit.service';
import { SoalService } from 'src/soal/soal.service';
import { ValidateIsCreator } from 'src/Pipe/validate.is.creator';
const slugify = require('slugify')

@Injectable()
export class FormService {
  constructor(
    private knexService: KnexService, 
    private submitService: SubmitService, 
    private soalService: SoalService,
    private isCreator: ValidateIsCreator
  ) {}

  // Get All Form
  async getAll() {
    const get = await this.knexService.connection('forms')
      .select("*")
      .limit(10)
      .offset(0)

    if (get.length === 0) throw new NotFoundException('Tidak Ada Form Dari Category Tersebut')

    return {
      message: 'Berhasil Mendapatkan Seluruh Form',
      data: get,
    }
  }

  // Get All By Category
  async getAllByCategory(category: string) {
    const lower = category.toLowerCase()
    const get = await this.knexService.connection('forms')
      .select("*")
      .limit(10)
      .offset(0)
      .where("category", lower)

    if (get.length === 0) throw new NotFoundException('Tidak Ada Form Dari Category Tersebut')

    return {
      message: 'Berhasil Mendapatkan Seluruh Form',
      data: get,
    }
  }

  // Get By Slug
  async getFormBySlug(slug: string) {
      const getForm = await this.knexService.connection("forms")
      .select("*")
      .where("slug", slug)
      .first()

      if(!getForm) throw new NotFoundException("Tidak Ada Form")
      
      const listSoal = await this.soalService.getSoalByForm(getForm.id)

      return {
        message: "Berhasil Mendapatkan Form",
        data: {
          ...getForm,
          soal: listSoal
        }
      }
  }

  // Get All My Form
  async getMyForm(data: { id: number, username: string }) {
    const get = await this.knexService.connection('user_form')
      .innerJoin('forms', 'forms.id', 'user_form.form_id')
      .select({
        id: 'user_form.id',
        user_id: 'user_form.user_id',
        access_type: 'user_form.access_type',

        form_id: 'forms.id',
        form_slug: 'forms.slug',
        form_title: 'forms.title',
        form_status: 'forms.status',
        form_banner: 'forms.banner',
        category: 'forms.category',
      })
      .where('user_form.user_id', data.id)

    return {
      message: 'Berhasil Mendapatkan Form Yang Anda Terlibat',
      data: {
        user_id: data.id,
        username: data.username,
        forms: get
      },
    }
  }

  // Create Form
  async create(user: { id: number, username: string }, body: { title: string, category: string }, banner: Express.Multer.File) {
    const slug = slugify(body.title, { lower: true, strict: true })
    const finalSlug = `${slug}-${Date.now()}`
    const bannerPath = `/uploads/${banner.filename}`

    const formResult = await this.knexService.connection.transaction(async (trx) => {
      await trx('file_upload').insert({ file_path: bannerPath })

      const [insertedForm] = await trx('forms')
        .insert({
          title: body.title,
          slug: finalSlug,
          status: 'private',
          category: body.category,
          banner: bannerPath,
        })
        .returning('*')

      const formId = typeof insertedForm === 'object' ? insertedForm.id : insertedForm

      await trx('user_form').insert({
        user_id: user.id,
        form_id: formId,
        access_type: 'Creator',
      })

      return { formId }
    })

    return {
      message: 'Berhasil Membuat Form',
      data: {
        user: {
          user_id: user.id,
          username: user.username,
          access_type: 'Creator',
        },
        form: {
          form_id: formResult.formId,
          form_title: body.title,
          form_slug: finalSlug,
          form_status: 'private',
          form_banner: bannerPath,
          category: body.category,
        },
      },
    }
  }

  // Update Form Public
  async updateForm(req: {id: number }, form_id, status: string ){
    const isCreator = await this.isCreator.isCreator(req.id, form_id.id)
    const validateStatus = ['public', 'private']

    if(!validateStatus.includes(status)) throw new BadRequestException("Isi Yang Benar")
    const updateToPublic = await this.knexService.connection("forms")
    .update({status: status})
    .where("id", form_id.id)

    return {
      message: `Berhasil Mengubah ke ${status}`
    }
  }

  // Delete Form
  async deleteForm(req: { id: number}, form_id) {
    const isCreator = await this.isCreator.isCreator(req.id, form_id.id)
    const deleteForm = await this.knexService.connection("forms")
    .delete()
    .where("id", form_id.id)

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
