import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common'
import { KnexService } from 'src/database/knex.service'
import { SubmitService } from '../submit/submit.service'
import { SoalService } from 'src/soal/soal.service'
const slugify = require('slugify')

@Injectable()
export class FormService {
  constructor( private knexService: KnexService, private submitService: SubmitService, private soalService: SoalService ) {}

  // Get All For Development
  async getAll(category: string) {
    const get = await this.knexService.connection('forms')
      .join('category', 'category.id', 'forms.category_id')
      .select({
        id: 'forms.id',
        form_title: 'forms.title',
        form_slug: 'forms.slug',
        form_status: 'forms.status',
        category_id: 'category.id',
        category: 'category.category_name',
      })
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
          access_type: e.access_type,
          category: e.category,
        })),
      },
    }
  }

  // Create Form
  async create(req: { id: number, username: string }, title: string, category_id: number) {
    const slug = slugify(title, { lower: true, strict: true })
    const finalSlug = slug + '-' + Date.now()

    const [createForm] = await this.knexService.connection('forms')
      .insert({ title: title, slug: finalSlug, status: 'private', category_id: category_id })
      .returning('*')

    const [createUserForm] = await this.knexService.connection('user_form')
      .insert({ user_id: req.id, form_id: createForm.id, access_type: 'Creator' })
      .returning('id')

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
        category: 'category.category_name',
      })
      .where('user_form.id', createUserForm.id)
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
          form_status: get.form_title,
          category: get.category,
        },
      },
    }
  }

  // Get My Submit History
  async getMySubmitForm(req: { id: number, username: string }, form_id: number) {
    return this.submitService.getMySubmitForm(req, form_id)
  }

  async getAllRespon(req: {id: number, username: string}, form_id: number){
    const isApproved = await this.knexService.connection('user_form')
      .select('access_type')
      .where({ user_id: req.id, form_id: form_id })
      .first()

    if (!isApproved || (isApproved.access_type !== 'Creator' && isApproved.access_type !== 'Collaborator')) {
      throw new UnauthorizedException('Anda Tidak Berhak Mengakses Ini')
    }

    const submissions = await this.knexService.connection('form_submit')
      .join('forms', 'forms.id', 'form_submit.form_id')
      .select({
        form_submit_id: 'form_submit.id',
        user_id: 'form_submit.user_id',
        submitted_at: 'form_submit.submitted_at',
        form_id: 'forms.id',
        form_title: 'forms.title',
      })
      .where('forms.id', form_id)
      .orderBy('form_submit.id')

    if (submissions.length === 0) throw new NotFoundException('Belum Ada Respon Untuk Form Ini')

    const questions = await this.knexService.connection('soal')
      .leftJoin('soal_option', 'soal_option.soal_id', 'soal.id')
      .leftJoin('option_value', 'option_value.id', 'soal_option.option_value_id')
      .select({
        soal_id: 'soal.id',
        question: 'soal.question',
        type: 'soal.type',
        soal_option_id: 'soal_option.id',
        option_value: 'option_value.value',
        is_correct: 'soal_option.is_correct',
      })
      .where('soal.form_id', form_id)
      .orderBy('soal.id')
      .orderBy('soal_option.id')

    if (questions.length === 0) throw new NotFoundException('Data tidak ditemukan')

    const questionMap = new Map<number, {
      soal_id: number
      question: string
      type: string
      options: Array<{
        soal_option_id: number
        option_value: string
        is_correct: boolean
      }>
    }>()

    for (const row of questions) {
      if (!questionMap.has(row.soal_id)) {
        questionMap.set(row.soal_id, {
          soal_id: row.soal_id,
          question: row.question,
          type: row.type,
          options: [],
        })
      }

      if (row.soal_option_id) {
        questionMap.get(row.soal_id)?.options.push({
          soal_option_id: row.soal_option_id,
          option_value: row.option_value,
          is_correct: Boolean(row.is_correct),
        })
      }
    }

    const answers = await this.knexService.connection('user_answer')
      .leftJoin('soal_option', 'user_answer.soal_option_id', 'soal_option.id')
      .leftJoin('soal', 'soal_option.soal_id', 'soal.id')
      .leftJoin('option_value', 'soal_option.option_value_id', 'option_value.id')
      .leftJoin('file_upload', 'user_answer.file_id', 'file_upload.id')
      .select({
        submitted_id: 'user_answer.submitted_id',
        soal_id: 'soal.id',
        soal_option_id: 'soal_option.id',
        answer_text: 'user_answer.answer_text',
        file_path: 'file_upload.file_path',
      })
      .whereIn('user_answer.submitted_id', submissions.map((submission) => submission.form_submit_id))
      .orderBy('user_answer.submitted_id')
      .orderBy('soal.id')
      .orderBy('soal_option.id')

    const response = submissions.map((submission) => {
      const selectedOptionIds = new Map<number, Set<number>>()
      const textAnswers = new Map<number, string>()
      const fileAnswers = new Map<number, string>()

      for (const answer of answers) {
        if (answer.submitted_id !== submission.form_submit_id) continue

        if (answer.soal_id && answer.soal_option_id) {
          if (!selectedOptionIds.has(answer.soal_id)) {
            selectedOptionIds.set(answer.soal_id, new Set<number>())
          }

          selectedOptionIds.get(answer.soal_id)?.add(answer.soal_option_id)
        }

        if (answer.soal_id && answer.answer_text) {
          textAnswers.set(answer.soal_id, answer.answer_text)
        }

        if (answer.soal_id && answer.file_path) {
          fileAnswers.set(answer.soal_id, answer.file_path)
        }
      }

      const questionsResult = Array.from(questionMap.values()).map((question) => {
        const questionResult: {
          soal_id: number
          question: string
          type: string
          user_answer_text: string | null
          user_file_path: string | null
          options: Array<{
            soal_option_id: number
            option_value: string
            is_correct: boolean
            is_user_selected: boolean
          }>
        } = {
          soal_id: question.soal_id,
          question: question.question,
          type: question.type,
          user_answer_text: null,
          user_file_path: null,
          options: [],
        }

        if (question.type === 'radio' || question.type === 'checkbox') {
          questionResult.options = question.options.map((option) => ({
            ...option,
            is_user_selected: selectedOptionIds.get(question.soal_id)?.has(option.soal_option_id) ?? false,
          }))
        }

        if (question.type === 'text') {
          questionResult.user_answer_text = textAnswers.get(question.soal_id) ?? null
        }

        if (question.type === 'file') {
          questionResult.user_file_path = fileAnswers.get(question.soal_id) ?? null
        }

        return questionResult
      })

      return {
        submit_id: submission.form_submit_id,
        user_id: submission.user_id,
        submitted_at: submission.submitted_at,
        questions: questionsResult,
      }
    })

    return {
      message: 'Berhasil Mendapatkan Seluruh Respon',
      data: {
        form_id: submissions[0].form_id,
        form_title: submissions[0].form_title,
        total_respon: response.length,
        respon: response,
      },
    }
  }
}
