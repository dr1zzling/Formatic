import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { KnexService } from '../database/knex.service';
import { SoalService } from '../soal/soal.service';
import { ValidateIsCreator } from '../Pipe/validate.is.creator';
import * as crypto from 'crypto'
const slugify = require('slugify')

@Injectable()
export class FormService {
  constructor(
    private knexService: KnexService, 
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
        token_respon: 'forms.token_respon',
        token_collab: 'forms.token_collab',
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
  async create(user: { id: number, username: string }, body: { title: string, category: string, token_respon: string }, banner: Express.Multer.File) {
    const slug = slugify(body.title, { lower: true, strict: true })
    const finalSlug = `${slug}-${Date.now()}`
    const bannerPath = `/uploads/${banner.filename}`
    const tokenCollab = await crypto.randomBytes(64).toString('hex')

    const formResult = await this.knexService.connection.transaction(async (trx) => {
      await trx('file_upload').insert({ file_path: bannerPath })

      const [insertedForm] = await trx('forms')
        .insert({
          title: body.title,
          slug: finalSlug,
          status: 'private',
          category: body.category,
          banner: bannerPath,
          token_respon: body.token_respon,
          token_collab: tokenCollab
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
          token_collab: formResult.token_collab,
          token_respon: formResult.token_respon,
          category: body.category,
        },
      },
    }
  }

  // Update Form Public
  async updateForm(req: {id: number }, form_id, status: string ){
    const isCreator = await this.isCreator.isCreator(req.id, form_id.id)
    if(isCreator != 'Creator') throw new UnauthorizedException("Anda Tidak Berhak Menghapus Form Ini")
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
    if(isCreator != 'Creator') throw new UnauthorizedException("Anda Tidak Berhak Menghapus Form Ini")
    const deleteForm = await this.knexService.connection("forms")
    .delete()
    .where("id", form_id.id)

    return {
      message: "Berhasil Menghapus" 
    }
  }

  // Jadi collaborator
  async changeRole(req: { id: number, username: string}, form_id, token_collab: string){
    const isCreator = await this.isCreator.isCreator(req.id, form_id.id)
    if(isCreator == 'Collaborator' || isCreator == 'Creator') throw new UnauthorizedException("Anda sudah menjadi bagian dari form ini")

    // Get Form
    if(form_id.token_collab != token_collab) throw new BadRequestException("Token Salah")
    
    const changeRole = await this.knexService.connection("user_form")
    .insert({
      user_id: req.id,
      form_id: form_id.id,
      access_type: 'Collaborator'
    })
    .returning("access_type")

    return {
      message: "Selamat Anda Sekarang Collaborator",
      data: {
        user_id: req.id,
        username: req.username,
        access_type: changeRole.access_type,
        ...form_id,
      }
    }
  }

}
