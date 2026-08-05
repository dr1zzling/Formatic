import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { KnexService } from 'src/database/knex.service'

@Injectable()
export class SoalService {
    constructor(private knexService: KnexService) { }

    // Get Soal From Form
    async getSoalByForm(id: number) {
        const get = await this.knexService
            .connection("forms")
            .join("category", "category.id", "forms.category_id")
            .leftJoin("soal", "soal.form_id", "forms.id")
            .leftJoin("soal_option", "soal_option.soal_id", "soal.id")
            .leftJoin("option_value", "option_value.id", "soal_option.option_value_id")
            .select({
                form_id: "forms.id",
                form_title: "forms.title",
                category: "category.category_name",

                soal_id: "soal.id",
                soal_question: "soal.question",
                soal_type: "soal.type",

                option_id: "soal_option.id",
                option_value: "option_value.value",
                option_value_id: "option_value.id",
                is_correct: "soal_option.is_correct",
            })
            .where("forms.id", id)

        if (get.length === 0) throw new NotFoundException("Form tidak ditemukan atau tidak memiliki soal apapun")

        const soalMap = new Map()

        get.forEach((row) => {
            if (row.soal_id) {
                if (!soalMap.has(row.soal_id)) {
                    soalMap.set(row.soal_id, {
                        id: row.soal_id,
                        question: row.soal_question,
                        type: row.soal_type,
                        options: [],
                    })
                }

                if (row.option_id) {
                    soalMap.get(row.soal_id).options.push({
                        id: row.option_id,
                        option_value_id: row.option_value_id,
                        option_value: row.option_value,
                        is_correct: row.is_correct,
                    })
                }
            }
        })

        const listSoal = Array.from(soalMap.values())

        return listSoal
    }

    // Create Soal And Option
    async createSoalAndOption(id: number, body: any) {
        // Validasi
        if (!body || (typeof body === 'object' && Object.keys(body).length === 0)) {
            throw new BadRequestException('Request body tidak boleh kosong!')
        }

        const listSoal = Array.isArray(body) ? body : [body]

        if (listSoal.length === 0) throw new BadRequestException("Isi Yang Benar")

        // Proses Insert
        const proses = await Promise.all(listSoal.map(async (list) => {
            const soal = list.soal
            const option_value = Array.isArray(list.option_value) ? list.option_value : [list.option_value]
            const soal_option = list.soal_option

            const [insertSoal] = await this.knexService.connection("soal").insert({ form_id: id, question: soal.question, type: soal.type}).returning("*")

            // Jika Radio, Checkbox, Rating
            if(soal.type === "radio" || soal.type === "checkbox" || soal.type === "rating"){
                const insert_option_value = await this.knexService.connection("option_value")
                .insert(option_value)
                .returning("*")

                const payload_insert_soal_option = insert_option_value.map((e) => {
                    return {
                        soal_id: insertSoal.id,
                        option_value_id: e.id,
                        is_correct: soal_option.is_correct
                    }
                })
                const insert_soal_option = await this.knexService.connection("soal_option")
                .insert(payload_insert_soal_option)
                .returning("id")

                const get = await this.knexService.connection("soal_option")
                .join("option_value", "option_value.id", "soal_option.option_value_id")
                .select({
                    id: "soal_option.id",
                    is_correct: "soal_option.is_correct",
                    option_value_id: "option_value.id",
                    option_value: "option_value.value"
                })
                .where("soal_option.soal_id", insertSoal.id)

                return {
                    soal: {
                        id: insertSoal.id,
                        question: insertSoal.question,
                        type: insertSoal.type
                    },
                    options: get.map((e) => ({
                        id: e.id,
                        is_correct: e.is_correct,
                        option_value_id: e.option_value_id,
                        option_value: e.option_value
                    }))
                }
            }

            // Jika Bukan
            return {
                soal: insertSoal.id,
                question: insertSoal.question,
                type: insertSoal.type
            }
        }))

        return {
            message: `Berhasil Membuat ${listSoal.length} list soal`,
            data: {
                form_id: id,
                list_soal: proses
            }
        }
    }
}
