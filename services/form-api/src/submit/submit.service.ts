import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { KnexService } from "../database/knex.service"
import { ValidateIsCreator } from "../Pipe/validate.is.creator"
import { SoalService } from "../soal/soal.service"
import * as ExcelJS from 'exceljs'

@Injectable()
export class SubmitService {
  constructor(
    private knexService: KnexService,
    private isCreator: ValidateIsCreator,
    private soalService: SoalService
  ) { }

  // Insert/Update form_submit
  async changeFormSubmit(event, user_id: number, form_id: number, status: string, submitted_at?: number){
    if(event == "insert"){
      const [insertFormSubmit] = await this.knexService.connection("form_submit")
      .insert({ user_id: user_id, form_id: form_id, status: status })
      .returning("*")

      return insertFormSubmit
    }

    if(event == "update"){
      const [update] = await this.knexService.connection("form_submit")
      .update({ status: status, submitted_at: submitted_at })
      .where({user_id: user_id, form_id: form_id})

      const getUpdate = await this.knexService.connection("forms_submit")
      .select("*")
      .where({user_id: user_id, form_id: form_id})
      .first("*")

      return getUpdate
    }

    return false
  }

  // Check Token
  async checkTokenResponden(req: { id: number }, form: any, token: string) {
    const checkRole = await this.isCreator.isCreator(req.id, form.id)
    if (checkRole != false) throw new ForbiddenException("Anda Tidak Berhak Sebagai Responden")

    const isAlreadyProgress = await this.knexService.connection("form_submit")
    .select("id")
    .where({form_id: form.id, user_id: req.id})
    .first()

    if(isAlreadyProgress) throw new ForbiddenException("Anda sedang mengerjakan, harap minta creator untuk mereset")

    if (form.token_respon == null) {
      const insertFormSubmit = await this.changeFormSubmit("insert", req.id, form.id, "progress")

      return {
        message: "Berhasil",
        data: insertFormSubmit
      }
    }

    if (form.token_respon != token) throw new BadRequestException("Token Salah")

    const insertFormSubmit = await this.changeFormSubmit("insert", req.id, form.id, "progress")

    return {
      message: "Berhasil",
      data: insertFormSubmit
    }
  }

  // Get All Submit By Form
  async getAllSubmitByForm(req: { id: number }, form: any) {
    const checkRole = await this.isCreator.isCreator(req.id, form.id)
    if(checkRole == false) throw new ForbiddenException("Anda Tidak Berhak")

    const getSoal: any[] = await this.soalService.getSoalByForm(form.id, form.is_random)

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

  // Get All Submit Detail
  async getAllSubmitResponseByForm(req: { id: number }, form: any) {
    const checkRole = await this.isCreator.isCreator(req.id, form.id)
    if (checkRole === false) throw new ForbiddenException("Anda Tidak Berhak")

    const getSoal: any[] = await this.soalService.getSoalByForm(form.id, form.is_random)

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

  // Monitoring 
  async monitoringSubmit(req: { id: number}, form: any){
    const checkRole = await this.isCreator.isCreator(req.id, form.id)
    if(checkRole === false) throw new ForbiddenException("Anda Tidak Berhak")

    const getAllStatusSubmit = await this.knexService.connection("form_submit")
    .select("user_id", "start_at", "submitted_at", "status")

    return {
      message: "Berhasil mendapatkan status submit",
      status: getAllStatusSubmit
    }
  }

  // Export Excel
  async exportSubmitResponseToExcel(req: { id: number }, form: any): Promise<Buffer> {
    const checkRole = await this.isCreator.isCreator(req.id, form.id)
    if(checkRole == false) throw new ForbiddenException("Anda Tidak Berhak")

    const response = await this.getAllSubmitResponseByForm(req, form)
    const pageData = response.data || []

    const questionsList: { id: number, question: string }[] = []
    const optionsMap = new Map<number, string>()

    pageData.forEach((page: any) => {
      (page.soal || []).forEach((soal: any) => {
        questionsList.push({ id: soal.id, question: soal.question });

        (soal.options || []).forEach((opt: any) => {
          optionsMap.set(opt.id, opt.value)
        })
      })
    })

    const respondentMap = new Map<number, Record<string, any>>()

    pageData.forEach((page: any) => {
      (page.soal || []).forEach((soal: any) => {
        (soal.responses || []).forEach((resp: any) => {
          const { submitted_id, answer } = resp

          if (!respondentMap.has(submitted_id)) {
            respondentMap.set(submitted_id, { submitted_id })
          }

          let formattedAnswer = answer
          if (typeof answer === 'number' && optionsMap.has(answer)) {
            formattedAnswer = optionsMap.get(answer)
          } else if (typeof answer === 'string' && answer.includes(',')) {
            formattedAnswer = answer
              .split(',')
              .map((idStr) => {
                const idNum = parseInt(idStr.trim(), 10)
                return optionsMap.has(idNum) ? optionsMap.get(idNum) : idStr.trim()
              })
              .join(', ')
          }

          const respondentData = respondentMap.get(submitted_id)
          if (respondentData) {
            respondentData[`soal_${soal.id}`] = formattedAnswer ?? '-'
          }
        })
      })
    })

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Hasil Respon')

    const columns = [
      { header: 'No / Submitted ID', key: 'submitted_id', width: 20 },
      ...questionsList.map((q) => ({
        header: q.question,
        key: `soal_${q.id}`,
        width: 30,
      })),
    ]
    worksheet.columns = columns

    const headerRow = worksheet.getRow(1)
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } }
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '1F4E78' },
    }
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' }

    const rows = Array.from(respondentMap.values())
    worksheet.addRows(rows)

    const baseUrl = process.env.APP_URL || 'http://localhost:4000'

    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        if (rowNumber > 1) {
          const val = cell.value

          if (typeof val === 'string' && val.startsWith('/uploads/')) {
            const fullUrl = `${baseUrl}${val}`

            cell.value = {
              text: 'Lihat Gambar',
              hyperlink: fullUrl,
              tooltip: 'Klik untuk membuka gambar',
            }

            cell.font = {
              color: { argb: 'FF0000FF' },
              underline: true,
            }
          }
        }

        cell.alignment = { wrapText: true, vertical: 'middle' }
      })
    })

    const buffer = await workbook.xlsx.writeBuffer()
    return Buffer.from(buffer)
  }

  // Submit Form
  async submitForm(req: { id: number }, form: any, data: string, files: Express.Multer.File[] = []) {
    const checkRole = await this.isCreator.isCreator(req.id, form.id)
    if (checkRole != false) throw new ForbiddenException("Anda Tidak Berhak Sebagai Responden")

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
      if (existingSubmit.status == "completed") throw new ConflictException("Anda sudah mengisi form ini")

      const updateToCompleted = await this.changeFormSubmit("update", req.id, form.id, "completed", this.knexService.connection.fn.now())

      await trx('user_answer').insert(
        answers.map((answer) => ({ ...answer, submitted_id: updateToCompleted.id }))
      )

      return updateToCompleted
    })

    return {
      message: "Berhasil Mengirim Jawaban",
      data: result
    }
  }
}