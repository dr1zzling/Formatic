import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
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
  async checkTokenResponden(req: { id: number }, form, token: string) {
    const checkRole = await this.isCreator.isCreator(req.id, form.id)
    
    if (checkRole != false) throw new UnauthorizedException("Anda Tidak Berhak Sebagai Responden")

    if (form.token_respon == null) return { message: "Berhasil" }
    if (form.token_respon != token) throw new BadRequestException("Token Salah")

    return {
      message: "Berhasil"
    }
  }

  // Get All Submit By Form
  async getAllSubmitByForm(req: { id: number }, form) {
    // const checkRole = await this.isCreator.isCreator(req.id, form.id)
    // if(checkRole == false) throw new UnauthorizedException("Anda Tidak Berhak Akses Form Ini")

    const getSoal = await this.soalService.getSoalByForm(form.id)

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

    const optionCountMap = optionCountRows.reduce((acc, row) => {
      const key = `${row.soal_id}_${row.option_value_id}`
      acc[key] = Number(row.total)
      return acc
    }, {})

    const questions = getSoal.map((question) => ({
      ...question,
      options: Array.isArray(question.options)
        ? question.options.map((option) => {
          const key = `${question.id}_${option.option_value_id}`
          return {
            ...option,
            total_answer: optionCountMap[key] ?? 0,
          }
        })
        : question.options,
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

  async getAllSubmitResponseByForm(req: { id: number }, form) {
    const checkRole = await this.isCreator.isCreator(req.id, form.id)
    if(checkRole == false) throw new UnauthorizedException("Anda Tidak Berhak")
      
    const getSoal = await this.soalService.getSoalByForm(form.id)

    const getAllSubmit = await this.knexService.connection("form_submit")
      .select("*")
      .where("form_id", form.id)

    const submitId = getAllSubmit.map((item) => item.id)

    if (submitId.length === 0) {
      return {
        message: "Berhasil Mendapatkan Detail Submit",
        data: getSoal.map((soal) => ({
          ...soal,
          responses: []
        }))
      }
    }

    const getSubmittedDetail = await this.knexService.connection("user_answer")
      .select("*")
      .whereIn("submitted_id", submitId)

    const answersBySoal = getSubmittedDetail.reduce((acc, item) => {
      const soalId = item.soal_id

      if (!acc[soalId]) {
        acc[soalId] = [];
      }

      let answerValue: any = null
      if (item.soal_option_id !== null) {
        answerValue = item.soal_option_id
      } else if (item.answer_text !== null) {
        answerValue = item.answer_text
      } else if (item.file_id !== null) {
        answerValue = item.file_id
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

    const result = getSoal.map((soal) => {
      const rawResponses = answersBySoal[soal.id] || []

      const formattedResponses = rawResponses.map((res: any) => ({
        submitted_id: res.submitted_id,
        answer: Array.isArray(res.answer) ? res.answer.join(", ") : res.answer
      }));

      return {
        ...soal,
        responses: formattedResponses
      }
    })

    return {
      message: "Berhasil Mendapatkan Detail Submit",
      data: result
    }
  }

}