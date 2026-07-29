import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { KnexService } from 'src/database/knex.service'

@Injectable()
export class SoalService {
    constructor(private knexService: KnexService) { }

    // Get Soal From Form
    async getSoalByForm(id: number) {
        const get = await this.knexService
            .connection("forms")
            .leftJoin("soal", "soal.form_id", "forms.id")
            .leftJoin("soal_option", "soal_option.soal_id", "soal.id")
            .select({
                form_id: "forms.id",
                form_title: "forms.title",

                soal_id: "soal.id",
                soal_question: "soal.question",
                soal_type: "soal.type",

                option_id: "soal_option.id",
                option_value: "soal_option.option_value",
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
                        option_value: row.option_value,
                        is_correct: row.is_correct,
                    })
                }
            }
        })

        const listSoal = Array.from(soalMap.values())

        return {
            message: `Berhasil Mendapatkan Semua Soal Dari Form ${get[0].form_title}`,
            data: {
                form_id: get[0].form_id,
                form_title: get[0].form_title,
                total_soal: listSoal.length,
                list_soal: listSoal,
            },
        }
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
            const options = Array.isArray(list.soal_option)
                ? list.soal_option
                : [list.soal_option]

            // Insert Soal
            const [insertSoal] = await this.knexService.connection("soal")
                .insert({ question: soal.question, form_id: id, type: soal.type })
                .returning("*")

            // Insert Option
            const payloadOptions = options.map((e) => ({
                option_value: e.option_value,
                is_correct: e.is_correct ?? false,
                soal_id: insertSoal.id,
            }))

            const listOption = await this.knexService.connection("soal_option")
                .insert(payloadOptions)
                .returning("*")

            return {
                soal: {
                    id: insertSoal.id,
                    question: insertSoal.question,
                    type: insertSoal.type
                },
                option: listOption.map((e) => ({
                    id: e.id,
                    option_value: e.option_value,
                    is_correct: e.is_correct
                }))
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
