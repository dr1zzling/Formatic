import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { KnexService } from '../database/knex.service'
import { FormEventsGateway } from '../form/form-events.gateway'
import * as mammoth from 'mammoth'

@Injectable()
export class SoalService {
    constructor(
        private knexService: KnexService,
        private formEventsGateway: FormEventsGateway
    ) { }

    private async broadcastFormUpdate(formId: number) {
        try {
            const form = await this.knexService.connection('forms').where('id', formId).first()
            if (form) {
                const updatedSoal = await this.getSoalByForm(formId)
                this.formEventsGateway.notifyFormUpdated(form.id, form.slug, updatedSoal)
            }
        } catch (error) {
            console.error('Broadcast update error:', error)
        }
    }

    async importDocx(form_slug, buffer: Buffer) {
        const result = await mammoth.extractRawText({ buffer })
        const lines = result.value
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean)

        const parsedSoal: any[] = []
        let current: any = null

        const saveCurrent = () => {
            if (!current) return
            if (!current.soal.question) {
                throw new BadRequestException('Ada soal tanpa pertanyaan')
            }

            const answerKeys = current.answer
                ? current.answer.split(/[,\s]+/).filter(Boolean).map((key) => key.toUpperCase())
                : []
            const options = current.options.map((option) => ({
                value: option.value,
                is_correct: answerKeys.includes(option.key),
            }))

            parsedSoal.push({
                soal: {
                    question: current.soal.question,
                    type: current.type || (options.length > 0 ? (answerKeys.length > 1 ? 'checkbox' : 'radio') : 'text'),
                },
                options,
            })
            current = null
        }

        for (const line of lines) {
            const questionMatch = line.match(/^\d+[.)]\s+(.+)$/)
            const optionMatch = line.match(/^([A-Z])[.)]\s+(.+)$/i)
            const answerMatch = line.match(/^(?:kunci|jawaban)\s*:\s*(.+)$/i)
            const typeMatch = line.match(/^tipe\s*:\s*(radio|checkbox|rating|text|file)$/i)

            if (questionMatch) {
                saveCurrent()
                current = { soal: { question: questionMatch[1] }, options: [], answer: null, type: null }
            } else if (!current) {
                throw new BadRequestException('Format DOCX tidak valid: soal harus diawali nomor, contoh "1. Pertanyaan"')
            } else if (optionMatch) {
                current.options.push({ key: optionMatch[1].toUpperCase(), value: optionMatch[2] })
            } else if (answerMatch) {
                current.answer = answerMatch[1]
            } else if (typeMatch) {
                current.type = typeMatch[1].toLowerCase()
            } else if (!current.options.length) {
                current.soal.question += ` ${line}`
            } else {
                throw new BadRequestException(`Format DOCX tidak valid pada baris: ${line}`)
            }
        }

        saveCurrent()
        if (parsedSoal.length === 0) {
            throw new BadRequestException('Tidak ada soal yang ditemukan di dokumen DOCX')
        }

        return this.createSoalAndOption(form_slug, parsedSoal)
    }

    // Get Soal From Form
    async getSoalByForm(id: number) {
        const getSoal = await this.knexService.connection("soal")
            .select("*")
            .where("form_id", id)

        const soalId = getSoal.map((soal) => soal.id)
        const getOption = await this.knexService.connection("soal_option")
            .select("*")
            .whereIn("soal_id", soalId)

        return getSoal.map((soal) => ({
            id: soal.id,
            question: soal.question,
            type: soal.type,
            image: soal.image,
            score: soal.score,
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
                            score: soal.score,
                            image: soal.image ?? null
                        })
                        .returning(['id', 'question', 'type', 'image'])

                    if (!optionTypes.includes(soal.type)) return insertSoal

                    const optionList = Array.isArray(options) ? options : (options ? [options] : [])


                    const payloadSoalOption = optionList.map((optionValue, idx) => ({
                        soal_id: insertSoal.id,
                        image: optionValue.image ?? null,
                        value: optionValue.value,
                        is_correct: optionList[idx]?.is_correct ?? false
                    }))
                    const insertSoalOption = await trx('soal_option')
                        .insert(payloadSoalOption)
                        .returning(['id', 'is_correct', 'image', 'value'])

                    return {
                        soal: insertSoal,
                        options: insertSoalOption.map((so) => ({
                            id: so.id,
                            value: so.value,
                            image: so.image ?? null,
                            is_correct: so.is_correct
                        })),
                    }
                }),
            )
        })

        await this.broadcastFormUpdate(form_slug.id)

        return {
            message: `Berhasil Membuat ${listSoal.length} list soal`,
            data: {
                form_slug: form_slug,
                list_soal: insert
            },
        }
    }

    // Delete Soal
    async deleteSoal(soal_id: number) {
        const existingSoal = await this.knexService.connection("soal")
            .where("id", soal_id)
            .first()

        const del = await this.knexService.connection("soal")
            .delete()
            .where('id', soal_id)

        if (existingSoal && existingSoal.form_id) {
            await this.broadcastFormUpdate(existingSoal.form_id)
        }

        return {
            message: "Berhasil Menghapus Soal"
        }
    }

    // Update Soal
    async updateSoal(soal_id: number, body: any) {
        const soal = { ...body.soal }

        delete soal.image_filename // just for testing with that html file
        if (!soal.image) {
            delete soal.image
        }

        const updateSoal = await this.knexService.connection("soal")
            .where("id", soal_id)
            .update(soal)
            .returning("*")

        const options = body.options ? (Array.isArray(body.options) ? body.options : [body.options]) : []

        const updateOption = await this.knexService.connection.transaction(async (trx) => {
            if (options.length > 0) {
                const keepIds = options.filter((e) => e.id).map((e) => Number(e.id))
                await trx("soal_option").where("soal_id", soal_id).whereNotIn("id", keepIds).delete()
            } else {
                await trx("soal_option").where("soal_id", soal_id).delete()
            }

            return Promise.all(
                options.map(async (e) => {
                    const payloadOption: any = {
                        value: e.value,
                        is_correct: Boolean(e.is_correct),
                    }

                    if (e.image) {
                        payloadOption.image = e.image
                    }

                    if (e.id) {
                        await trx("soal_option")
                            .where("id", e.id)
                            .update(payloadOption)

                        return await trx("soal_option").where("id", e.id).first()
                    } else {
                        const [inserted] = await trx("soal_option")
                            .insert({
                                soal_id: soal_id,
                                ...payloadOption
                            })
                            .returning("*")
                        return inserted
                    }
                })
            )
        })


        const existingSoal = await this.knexService.connection("soal")
            .where("id", soal_id)
            .first()

        if (existingSoal && existingSoal.form_id) {
            await this.broadcastFormUpdate(existingSoal.form_id)
        }

        return {
            message: "Berhasil Mengubah Soal",
            data: {
                soal: updateSoal,
                options: updateOption,
            },
        }
    }
}

