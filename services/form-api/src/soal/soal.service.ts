import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { KnexService } from '../database/knex.service'

@Injectable()
export class SoalService {
    constructor(private knexService: KnexService) { }

    // Get Soal From Form
    async getSoalByForm(id: number) {
        const getSoal = await this.knexService.connection("soal")
            .select("*")
            .where("form_id", id)

        const soalId = getSoal.map((soal) => soal.id)
        const getOption = await this.knexService.connection("soal_option")
            .innerJoin('option_value', 'option_value.id', 'soal_option.option_value_id')
            .select({
                id: "soal_option.id",
                soal_id: "soal_option.soal_id",
                is_correct: "soal_option.is_correct",
                value: "option_value.value",
                image: "option_value.image"
            })
            .whereIn("soal_id", soalId)

        return getSoal.map((soal) => ({
            id: soal.id,
            question: soal.question,
            type: soal.type,
            image: soal.image,
            options: getOption.filter((option) => option.soal_id == soal.id)
        }))
    }

    // Create Soal And Option
    async createSoalAndOption(form_slug, body: any) {
        // Validasi
        const listSoal = Array.isArray(body) ? body : [body]
        if (!body || listSoal.length === 0) {
            throw new BadRequestException('Request body tidak valid!')
        }

        const optionTypes = ['radio', 'checkbox', 'rating']

        // Insert
        const insert = await this.knexService.connection.transaction(async (trx) => {
            return Promise.all(
                listSoal.map(async ({ soal, options }) => {

                    const [insertSoal] = await trx('soal')
                        .insert({
                            form_id: form_slug.id,
                            question: soal.question,
                            type: soal.type,
                            image: soal.image ?? null
                        })
                        .returning(['id', 'question', 'type', 'image'])

                    if (!optionTypes.includes(soal.type)) return insertSoal

                    const optionList = Array.isArray(options) ? options : (options ? [options] : [])
                    const payloadOptionValue = optionList.map((option) => ({
                        value: option.value,
                        image: option.image ?? null
                    }))

                    const insertOptionValue = await trx('option_value')
                        .insert(payloadOptionValue)
                        .returning('*')

                    const payloadSoalOption = insertOptionValue.map((optionValue, idx) => ({
                        soal_id: insertSoal.id,
                        option_value_id: optionValue.id,
                        is_correct: optionList[idx]?.is_correct ?? false
                    }))
                    const insertSoalOption = await trx('soal_option')
                        .insert(payloadSoalOption)
                        .returning(['id', 'is_correct'])

                    return {
                        soal: insertSoal,
                        options: insertSoalOption.map((so, idx) => ({
                            id: so.id,
                            option_value_id: insertOptionValue[idx].id,
                            option_value: insertOptionValue[idx].value,
                            image: insertOptionValue[idx].image ?? null,
                            is_correct: so.is_correct
                        })),
                    }
                }),
            )
        })

        return {
            message: `Berhasil Membuat ${listSoal.length} list soal`,
            data: {
                form_slug: form_slug,
                list_soal: insert
            },
        }
    }
}
