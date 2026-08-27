import { BadRequestException, ConflictException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { KnexService } from "../database/knex.service";
import { ValidateIsCreator } from "../Pipe/validate.is.creator";
import { SoalService } from "../soal/soal.service";

@Injectable()
export class SubmitService {
  constructor(
    private knexService: KnexService,
    private isCreator: ValidateIsCreator,
    private soalService: SoalService
  ) { }

  // Check Token
  async checkTokenResponden(req: { id: number }, form: any, token: string) {
    const checkRole = await this.isCreator.isCreator(req.id, form.id)

    if (checkRole != false) throw new UnauthorizedException("Anda Tidak Berhak Sebagai Responden")

    if (form.token_respon == null) return { message: "Berhasil" }
    if (form.token_respon != token) throw new BadRequestException("Token Salah")

    return {
      message: "Berhasil"
    }
  }

  // Get All Submit By Form
  async getAllSubmitByForm(req: { id: number }, form: any) {
    const getSoal: any[] = await this.soalService.getSoalByForm(form.id)

    const totalSubmit = await this.knexService.connection('form_submit')
      .count('* as total')
      .where('form_id', form.id)
      .first()

    const optionCountRows = await this.knexService.connection('user_answer')
      .innerJoin('form_submit', 'form_submit.id', 'user_answer.submitted_id')
      .select('user_answer.soal_id', 'user_answer.soal_option_id as option_value_id')
      .count('user_answer.id as total')
      .where('form_submit.form_id', form.id)
      .whereNotNull('user_answer.soal_option_id')
      .groupBy('user_answer.soal_id', 'user_answer.soal_option_id')

    const optionCountMap = optionCountRows.reduce((acc: any, row: any) => {
      const key = `${row.soal_id}_${row.option_value_id}`
      acc[key] = Number(row.total)
      return acc
    }, {})

    const textAnswersRows = await this.knexService.connection('user_answer')
      .innerJoin('form_submit', 'form_submit.id', 'user_answer.submitted_id')
      .select('user_answer.soal_id', 'user_answer.answer_text')
      .where('form_submit.form_id', form.id)
      .whereNotNull('user_answer.answer_text')

    const textAnswersMap = textAnswersRows.reduce((acc: any, row: any) => {
      if (!acc[row.soal_id]) acc[row.soal_id] = []
      if (row.answer_text) acc[row.soal_id].push(row.answer_text)
      return acc
    }, {})

    const questions = getSoal.map((pageGroup: any) => ({
      ...pageGroup,
      soal: Array.isArray(pageGroup.soal)
        ? pageGroup.soal.map((soalItem: any) => ({
          ...soalItem,
          options: Array.isArray(soalItem.options)
            ? soalItem.options.map((option: any) => {
              const key = `${soalItem.id}_${option.id}`
              return {
                ...option,
                total_answer: optionCountMap[key] ?? 0,
              }
            })
            : [],
          text_answers: textAnswersMap[soalItem.id] || [],
        }))
        : [],
    }))

    return {
      message: "Berhasil Mendapatkan Response",
      data: {
        form_id: form.id,
        form_title: form.title,
        form_slug: form.slug,
        total_submit: Number(totalSubmit?.total ?? 0),
        questions,
      }
    }
  }

  async getAllSubmitResponseByForm(req: { id: number }, form: any) {
    const checkRole = await this.isCreator.isCreator(req.id, form.id)
    if (checkRole === false) throw new UnauthorizedException("Anda Tidak Berhak")

    const getSoal: any[] = await this.soalService.getSoalByForm(form.id)

    const getAllSubmit = await this.knexService.connection("form_submit")
      .select("*")
      .where("form_id", form.id)

    const submitId = getAllSubmit.map((item: any) => item.id)

    if (submitId.length === 0) {
      return {
        message: "Berhasil Mendapatkan Detail Submit",
        data: getSoal.map((pageGroup: any) => ({
          ...pageGroup,
          soal: Array.isArray(pageGroup.soal)
            ? pageGroup.soal.map((s: any) => ({ ...s, responses: [] }))
            : []
        }))
      }
    }

    const getSubmittedDetail = await this.knexService.connection("user_answer")
      .select("*")
      .whereIn("submitted_id", submitId)

    // Grouping jawaban berdasarkan soal_id
    const answersBySoal = getSubmittedDetail.reduce((acc: any, item: any) => {
      const soalId = item.soal_id

      if (!acc[soalId]) {
        acc[soalId] = []
      }

      let answerValue: any = null
      if (item.soal_option_id !== null) {
        answerValue = item.soal_option_id
      } else if (item.answer_text !== null) {
        answerValue = item.answer_text
      } else if (item.image !== null) {
        answerValue = item.image
      }

      const existingIndex = acc[soalId].findIndex(
        (resp: any) => resp.submitted_id === item.submitted_id
      )

      if (existingIndex > -1) {
        const currentVal = acc[soalId][existingIndex].answer
        if (Array.isArray(currentVal)) {
          acc[soalId][existingIndex].answer.push(answerValue)
        } else {
          acc[soalId][existingIndex].answer = [currentVal, answerValue]
        }
      } else {
        acc[soalId].push({
          submitted_id: item.submitted_id,
          answer: answerValue
        })
      }

      return acc
    }, {})

    // Map nested structure: Page -> Soal -> Responses
    const result = getSoal.map((pageGroup: any) => ({
      ...pageGroup,
      soal: Array.isArray(pageGroup.soal)
        ? pageGroup.soal.map((soalItem: any) => {
          const rawResponses = answersBySoal[soalItem.id] || []
          const formattedResponses = rawResponses.map((res: any) => ({
            submitted_id: res.submitted_id,
            answer: Array.isArray(res.answer) ? res.answer.join(", ") : res.answer
          }))

          return {
            ...soalItem,
            responses: formattedResponses
          }
        })
        : []
    }))

    return {
      message: "Berhasil Mendapatkan Detail Submit",
      data: result
    }
  }

  async submitForm(req: { id: number }, form: any, data: string, files: Express.Multer.File[] = []) {
    const checkRole = await this.isCreator.isCreator(req.id, form.id)
    if (checkRole != false) throw new UnauthorizedException("Anda Tidak Berhak Sebagai Responden")

    let payload: any[]
    try {
      payload = JSON.parse(data)
    } catch {
      throw new BadRequestException("Data jawaban tidak valid")
    }

    if (!Array.isArray(payload) || payload.length === 0) {
      throw new BadRequestException("Data jawaban tidak valid")
    }

    const questions: any[] = await this.knexService.connection('soal')
      .select('id', 'type')
      .where('form_id', form.id)
    const questionMap = new Map(questions.map((question: any) => [question.id, question]))
    const answers: any[] = []
    let fileIndex = 0

    for (const item of payload) {
      const answer = item?.jawaban
      const question = questionMap.get(Number(answer?.soal_id))
      if (!question) throw new BadRequestException("Soal tidak sesuai dengan form")

      const optionIds = Array.isArray(answer.soal_option_id)
        ? answer.soal_option_id
        : answer.soal_option_id == null ? [] : [answer.soal_option_id]

      if (optionIds.length > 0) {
        const validOptions = await this.knexService.connection('soal_option')
          .where('soal_id', question.id)
          .whereIn('id', optionIds)
          .pluck('id')
        if (validOptions.length !== optionIds.length) {
          throw new BadRequestException("Pilihan jawaban tidak sesuai dengan soal")
        }
        for (const optionId of optionIds) {
          answers.push({ soal_id: question.id, soal_option_id: Number(optionId), answer_text: null, image: null })
        }
      } else if (question.type === 'file') {
        const file = files[fileIndex++]
        if (!file) throw new BadRequestException("File jawaban wajib diunggah")
        answers.push({ soal_id: question.id, soal_option_id: null, answer_text: null, image: `/uploads/answers/${file.filename}` })
      } else {
        if (typeof answer.answer_text !== 'string' || !answer.answer_text.trim()) {
          throw new BadRequestException("Jawaban teks wajib diisi")
        }
        answers.push({ soal_id: question.id, soal_option_id: null, answer_text: answer.answer_text, image: null })
      }
    }

    if (fileIndex !== files.length) throw new BadRequestException("Jumlah file jawaban tidak sesuai")

    const result = await this.knexService.connection.transaction(async (trx) => {
      const existingSubmit = await trx('form_submit')
        .where({ user_id: req.id, form_id: form.id })
        .first()
      if (existingSubmit) throw new ConflictException("Anda sudah mengisi form ini")

      const [submitted] = await trx('form_submit')
        .insert({ user_id: req.id, form_id: form.id, status: 'submitted' })
        .returning(['id', 'submitted_at', 'status'])

      await trx('user_answer').insert(
        answers.map((answer) => ({ ...answer, submitted_id: submitted.id }))
      )

      return submitted
    })

    return {
      message: "Berhasil Mengirim Jawaban",
      data: result
    }
  }
}