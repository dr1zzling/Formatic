import { BadRequestException, ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { KnexService } from 'src/database/knex.service';

@Injectable()
export class SubmitService {
  constructor(private knexService: KnexService) { }

  private async createSubmitFileUpload(
    trx: any,
    filePath: string | null | undefined,
  ) {
    if (!filePath) return null

    const [insertedFile] = await trx('file_upload')
      .insert({
        file_path: filePath,
      })
      .returning('id')

    return typeof insertedFile === 'object' ? insertedFile.id : insertedFile
  }

  // Get My Submit History
  async getMySubmitForm(req: { id: number, username: string }, form_id: number) {
    const getForm = await this.knexService.connection('form_submit')
      .join('forms', 'forms.id', 'form_submit.form_id')
      .select({
        id: 'form_submit.id',
        form_id: 'forms.id',
        form_title: 'forms.title',
        submitted_at: 'form_submit.submitted_at',
        status: 'form_submit.status',
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
      .leftJoin('soal', 'user_answer.soal_id', 'soal.id')
      .leftJoin('option_value', 'soal_option.option_value_id', 'option_value.id')
      .leftJoin('file_upload', 'user_answer.file_id', 'file_upload.id')
      .select({
        soal_id: 'user_answer.soal_id',
        soal_option_id: 'soal_option.id',
        answer_text: 'user_answer.answer_text',
        file_path: 'file_upload.file_path',
      })
      .where('user_answer.submitted_id', getForm.id)
      .orderBy('user_answer.soal_id')
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
        status: getForm.status,
        questions: questionsResult,
      },
    }
  }

  // Get All Submit By Form
  async getAllSubmitByForm(req: { id: number, username: string }, form_id: number) {
    const isApproved = await this.knexService.connection('user_form')
      .select('access_type')
      .where({ user_id: req.id, form_id: form_id })
      .first()

    if (!isApproved || (isApproved.access_type !== 'Creator' && isApproved.access_type !== 'Admin')) {
      throw new UnauthorizedException('Anda Tidak Berhak Mengakses Data Respon Form Ini')
    }

    const submissions = await this.knexService.connection('form_submit')
      .join('forms', 'forms.id', 'form_submit.form_id')
      .select({
        form_submit_id: 'form_submit.id',
        user_id: 'form_submit.user_id',
        submitted_at: 'form_submit.submitted_at',
        status: 'form_submit.status',
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
      .leftJoin('soal', 'user_answer.soal_id', 'soal.id')
      .leftJoin('option_value', 'soal_option.option_value_id', 'option_value.id')
      .leftJoin('file_upload', 'user_answer.file_id', 'file_upload.id')
      .select({
        submitted_id: 'user_answer.submitted_id',
        soal_id: 'user_answer.soal_id',
        soal_option_id: 'soal_option.id',
        answer_text: 'user_answer.answer_text',
        file_path: 'file_upload.file_path',
      })
      .whereIn('user_answer.submitted_id', submissions.map((submission) => submission.form_submit_id))
      .orderBy('user_answer.submitted_id')
      .orderBy('user_answer.soal_id')
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
        status: submission.status,
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

  // Create Submit
  async createSubmitForm(req: { id: number, username: string }, form_id: number, body: any, files: Express.Multer.File[] = []) {
    const listJawaban = Array.isArray(body) ? body : [body]
    if (!body || listJawaban.length === 0) {
      throw new BadRequestException("Isi Yang Benar")
    }

    // Apakah Responden/Creator
    const isResponden = await this.knexService
      .connection("user_form")
      .select("id")
      .where({ user_id: req.id, form_id: form_id })
      .first()

    if (isResponden) {
      throw new UnauthorizedException("Anda Tidak Berhak Mengisi Form Ini")
    }

    // Soal
    const soalIds = listJawaban.map((item) => item.jawaban?.soal_id).filter(Boolean)
    if (soalIds.length === 0) {
      throw new BadRequestException("Format jawaban tidak valid")
    }

    const soalList = await this.knexService
      .connection("soal")
      .select("id", "type")
      .whereIn("id", soalIds)

    const soalMap = new Map<number, string>(
      soalList.map((s) => [s.id, s.type])
    )

    // Apakah sudah diisi
    const existingSubmit = await this.knexService.connection('form_submit')
      .select('id')
      .where({ user_id: req.id, form_id: form_id })
      .first()

    if (existingSubmit) {
      throw new ConflictException('Anda sudah mengisi form ini')
    }

    return await this.knexService.connection.transaction(async (trx) => {
      const fileIdMap = new Map<string, number>()

      if (files && files.length > 0) {
        for (const file of files) {
          const filePath = `/uploads/${file.filename}`
          const fileId = await this.createSubmitFileUpload(trx, filePath)

          if (fileId) {
            fileIdMap.set(file.originalname, fileId)
            fileIdMap.set(file.filename, fileId)
          }
        }
      }

      // Insert ke form_submit
      const [insertFormSubmit] = await trx("form_submit")
        .insert({ user_id: req.id, form_id: form_id })
        .returning("id")

      const submittedId = typeof insertFormSubmit === 'object' ? insertFormSubmit.id : insertFormSubmit

      // Payload user_answer
      const answersToInsert: Array<{
        submitted_id: number
        soal_id: number
        soal_option_id?: number | null
        file_id?: number | string | null
        answer_text?: string | null
      }> = []

      let fileIndex = 0

      for (const item of listJawaban) {
        const jawaban = item.jawaban
        if (!jawaban || !jawaban.soal_id) continue

        const typeSoal = soalMap.get(jawaban.soal_id)
        if (!typeSoal) continue

        const normalizedType = typeSoal.toLowerCase()

        if (normalizedType === 'text') {
          answersToInsert.push({
            submitted_id: submittedId,
            soal_id: jawaban.soal_id,
            answer_text: jawaban.answer_text || null,
          })
        } else if (normalizedType === 'radio' || normalizedType === 'checkbox') {
          const options = Array.isArray(jawaban.soal_option_id)
            ? jawaban.soal_option_id
            : [jawaban.soal_option_id]

          const validOptionIds = await trx('soal_option')
            .select('id')
            .where('soal_id', jawaban.soal_id)

          const validOptionIdSet = new Set(validOptionIds.map((option: { id: number }) => option.id))

          for (const optId of options) {
            if (!optId) continue

            if (!validOptionIdSet.has(Number(optId))) {
              throw new BadRequestException(`Opsi ${optId} bukan milik soal ${jawaban.soal_id}`)
            }

            answersToInsert.push({
              submitted_id: submittedId,
              soal_id: jawaban.soal_id,
              soal_option_id: Number(optId),
            })
          }
        } else if (normalizedType === 'file') {
          let uploadedFileId = jawaban.file_name ? fileIdMap.get(jawaban.file_name) : null

          if (!uploadedFileId && files[fileIndex]) {
            const currentFile = files[fileIndex]
            uploadedFileId = fileIdMap.get(currentFile.originalname) ?? fileIdMap.get(currentFile.filename)
            fileIndex++
          }

          if (!uploadedFileId) {
            const requestedFilePath = jawaban.file_path || jawaban.filePath || (jawaban.file_name ? `/uploads/${jawaban.file_name}` : null)
            uploadedFileId = await this.createSubmitFileUpload(trx, requestedFilePath)
          }

          answersToInsert.push({
            submitted_id: submittedId,
            soal_id: jawaban.soal_id,
            file_id: uploadedFileId || jawaban.file_id || null,
          })
        }
      }

      // Batch Insert
      if (answersToInsert.length > 0) {
        await trx("user_answer").insert(answersToInsert)
      }

      return { message: "Submit form berhasil", submitted_id: submittedId }
    })
  }
}
