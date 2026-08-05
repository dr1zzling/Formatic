import { Injectable, NotFoundException } from '@nestjs/common'
import { KnexService } from 'src/database/knex.service'

@Injectable()
export class SubmitService {
  constructor(private knexService: KnexService) {}

  // Get My Submit History
  async getMySubmitForm(req: { id: number; username: string }, form_id: number) {
    const getForm = await this.knexService.connection('form_submit')
      .join('forms', 'forms.id', 'form_submit.form_id')
      .select({
        id: 'form_submit.id',
        form_id: 'forms.id',
        form_title: 'forms.title',
        submitted_at: 'form_submit.submitted_at',
        user_id: 'form_submit.user_id',
      })
      .where({ 'forms.id': form_id, 'form_submit.user_id': req.id })
      .first()

    if (!getForm) throw new NotFoundException('Data tidak ditemukan')

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
      user_answer_text: string | null
      user_file_path: string | null
      options: Array<{
        soal_option_id: number
        option_value: string
        is_correct: boolean
        is_user_selected: boolean
      }>
    }>()

    for (const row of questions) {
      if (!questionMap.has(row.soal_id)) {
        questionMap.set(row.soal_id, {
          soal_id: row.soal_id,
          question: row.question,
          type: row.type,
          user_answer_text: null,
          user_file_path: null,
          options: [],
        })
      }

      if (row.soal_option_id) {
        questionMap.get(row.soal_id)?.options.push({
          soal_option_id: row.soal_option_id,
          option_value: row.option_value,
          is_correct: Boolean(row.is_correct),
          is_user_selected: false,
        })
      }
    }

    const answers = await this.knexService
      .connection('user_answer')
      .leftJoin('soal_option', 'user_answer.soal_option_id', 'soal_option.id')
      .leftJoin('soal', 'soal_option.soal_id', 'soal.id')
      .leftJoin('option_value', 'soal_option.option_value_id', 'option_value.id')
      .leftJoin('file_upload', 'user_answer.file_id', 'file_upload.id')
      .select({
        soal_id: 'soal.id',
        soal_option_id: 'soal_option.id',
        answer_text: 'user_answer.answer_text',
        file_path: 'file_upload.file_path',
      })
      .where('user_answer.submitted_id', getForm.id)
      .orderBy('soal.id')
      .orderBy('soal_option.id')

    const selectedOptionIds = new Map<number, Set<number>>()
    const textAnswers = new Map<number, string>()
    const fileAnswers = new Map<number, string>()

    for (const answer of answers) {
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
      if (question.type === 'radio' || question.type === 'checkbox') {
        question.options = question.options.map((option) => ({
          ...option,
          is_user_selected: selectedOptionIds.get(question.soal_id)?.has(option.soal_option_id) ?? false,
        }))

        question.user_answer_text = null
        question.user_file_path = null
      }

      if (question.type === 'text') {
        question.user_answer_text = textAnswers.get(question.soal_id) ?? null
        question.user_file_path = null
        question.options = []
      }

      if (question.type === 'file') {
        question.user_answer_text = null
        question.user_file_path = fileAnswers.get(question.soal_id) ?? null
        question.options = []
      }

      return question
    })

    return {
      message: 'Berhasil Mendapatkan History Form',
      data: {
        user_id: req.id,
        username: req.username,
        form_id: getForm.form_id,
        form_title: getForm.form_title,
        submitted_at: getForm.submitted_at,
        questions: questionsResult,
      },
    }
  }

  async getAllSubmitByForm(form_id: number){
    const get = await this.knexService.connection("form_submit")
    .join("forms", "forms.id", "form_submit.form_id")
    .select({
      form_submit_id: "form_submit.id",
      submitted_at: "form_submit.submitted_at",

      form_id: "forms.id",
      form_title: "forms.title"
    })
    .where("forms.id", form_id)

    return {
      message: "Berhasil",
      data: get
    }
  }
}
