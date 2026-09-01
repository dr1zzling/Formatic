import { BadRequestException, Injectable } from '@nestjs/common'
import { KnexService } from '../database/knex.service'
import { FormEventsGateway } from '../form/form-events.gateway'
import JSZip from 'jszip'
import * as fs from 'fs'
import * as path from 'path'
import { v4 as uuidv4 } from 'uuid'

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
                const updatedSoal = await this.getSoalByForm(form.id, form.is_random)
                this.formEventsGateway.notifyFormUpdated(form.id, form.slug, updatedSoal)
            }
        } catch (error) {
            console.error('Broadcast update error:', error)
        }
    }

    async importDocx(form_slug: any, buffer: Buffer) {
        const zip = await JSZip.loadAsync(buffer)
        const documentXml = await zip.file('word/document.xml')?.async('text')

        if (!documentXml) {
            throw new BadRequestException('Document XML tidak ditemukan.')
        }

        const relationshipsXml = await zip.file('word/_rels/document.xml.rels')?.async('text') ?? ''
        const relationships: Record<string, string> = {}

        for (const match of relationshipsXml.matchAll(
            /<Relationship[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/g
        )) {
            relationships[match[1]] = match[2]
        }

        const paragraphs = documentXml.match(/<w:p(?:\s[^>]*)?>[\s\S]*?<\/w:p>/g) ?? []

        // Decode XML entities termasuk &lt; &gt; untuk kode
        const decodeEntities = (s: string) =>
            s.replace(/&amp;/g, '&')
             .replace(/&lt;/g, '<')
             .replace(/&gt;/g, '>')
             .replace(/&quot;/g, '"')
             .replace(/&apos;/g, "'")

        // Gabungkan semua <w:t> dalam paragraf, decode entities
        const getText = (xml: string): string => {
            return decodeEntities(
                [...xml.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)]
                    .map(m => m[1])
                    .join('')
                    .trim()
            )
        }

        // Deteksi apakah paragraf menggunakan font monospace (kode)
        const isCodeParagraph = (xml: string): boolean => {
            return /w:ascii="(?:Courier New|Courier|Consolas|Lucida Console|Monaco|Monospace)"/i.test(xml)
        }

        // Deteksi apakah paragraf menggunakan font matematika (Cambria Math)
        const isMathParagraph = (xml: string): boolean => {
            return /w:ascii="(?:Cambria Math|Latin Modern Math|XITS Math|Asana Math|Neo Euler|TeX Gyre)"/i.test(xml)
        }

        const getNumbering = (xml: string) => {
            const numId = xml.match(/<w:numId[^>]*w:val="(\d+)"/)?.[1] ?? null
            const ilvl  = xml.match(/<w:ilvl[^>]*w:val="(\d+)"/)?.[1] ?? null
            return { numId, ilvl }
        }

        const uploadDir = path.join(process.cwd(), 'uploads', 'soal')
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true })
        }

        // Simpan satu gambar berdasarkan embed rId, kembalikan path atau null
        const saveOneImage = async (embed: string): Promise<string | null> => {
            const target = relationships[embed]
            if (!target) return null

            const filePath = target.startsWith('media/')
                ? `word/${target}`
                : target.startsWith('../')
                    ? `word/${target.replace('../', '')}`
                    : `word/${target}`

            const file = zip.file(filePath)
            if (!file) return null

            const imageBuffer = await file.async('nodebuffer')
            const extension = filePath.split('.').pop()?.toLowerCase() || 'png'
            const fileName = `${Date.now()}-${uuidv4()}.${extension}`
            fs.writeFileSync(path.join(uploadDir, fileName), imageBuffer)
            return `/uploads/soal/${fileName}`
        }

        // Ambil semua gambar dari satu paragraf (bisa lebih dari satu drawing)
        const saveAllImagesFromParagraph = async (xml: string): Promise<string[]> => {
            const embeds = [...xml.matchAll(/r:embed="([^"]+)"/g)].map(m => m[1])
            const results: string[] = []
            for (const embed of embeds) {
                const url = await saveOneImage(embed)
                if (url) results.push(url)
            }
            return results
        }

        const finalParsedSoal: any[] = []
        let currentQuestion: any = null

        const finishQuestion = () => {
            if (!currentQuestion) return

            const answerKeys = currentQuestion.answer
                ? currentQuestion.answer
                    .split(',')
                    .map((x: string) => x.trim().toUpperCase())
                    .filter(Boolean)
                : []

            const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

            currentQuestion.options = currentQuestion.options.map(
                (option: any, index: number) => ({
                    value: option.value,
                    image: option.image ?? null,
                    is_correct:
                        answerKeys.includes(optionLetters[index]) ||
                        answerKeys.includes(String(index + 1)),
                })
            )

            if (!currentQuestion.type) {
                currentQuestion.type =
                    currentQuestion.options.length > 0
                        ? answerKeys.length > 1
                            ? 'checkbox'
                            : 'radio'
                        : 'text'
            }

            finalParsedSoal.push({
                soal: {
                    question: currentQuestion.question.trim(),
                    image: currentQuestion.image ?? null,
                    type: currentQuestion.type,
                },
                options: currentQuestion.options,
            })

            currentQuestion = null
        }

        // ── State untuk mengumpulkan baris kode berurutan ──────────────────
        let codeBuffer: string[] = []

        const flushCodeBuffer = () => {
            if (codeBuffer.length === 0) return null
            // Trim trailing blank lines
            while (codeBuffer.length > 0 && codeBuffer[codeBuffer.length - 1] === '') {
                codeBuffer.pop()
            }
            if (codeBuffer.length === 0) return null
            const block = '```\n' + codeBuffer.join('\n') + '\n```'
            codeBuffer = []
            return block
        }

        // ── State untuk mengumpulkan baris rumus matematika berurutan ──────
        let mathBuffer: string[] = []

        const flushMathBuffer = () => {
            if (mathBuffer.length === 0) return null
            while (mathBuffer.length > 0 && mathBuffer[mathBuffer.length - 1] === '') {
                mathBuffer.pop()
            }
            if (mathBuffer.length === 0) return null
            // Baris tunggal → inline $$, multi-baris → tiap baris display $$
            const block = mathBuffer.map(line => `$$${line}$$`).join('\n')
            mathBuffer = []
            return block
        }

        for (const paragraph of paragraphs) {
            let text       = getText(paragraph)
            const isCode   = isCodeParagraph(paragraph)
            const isMath   = isMathParagraph(paragraph)
            const images   = await saveAllImagesFromParagraph(paragraph)
            const image    = images[0] ?? null
            const extraImages = images.slice(1)
            const { numId, ilvl } = getNumbering(paragraph)

            // ── Kumpulkan baris kode ke buffer ──────────────────────────────
            if (isCode) {
                codeBuffer.push(text || '')
                continue
            }

            // ── Kumpulkan baris rumus ke math buffer ────────────────────────
            if (isMath) {
                mathBuffer.push(text || '')
                continue
            }

            // Blank line di tengah area kode → tetap masuk buffer, jangan flush
            if (!text && images.length === 0 && codeBuffer.length > 0) {
                codeBuffer.push('')
                continue
            }

            // Blank line di tengah area rumus → tetap masuk math buffer
            if (!text && images.length === 0 && mathBuffer.length > 0) {
                mathBuffer.push('')
                continue
            }

            // ── Flush code buffer ketika ada konten non-kode yang nyata ────
            if (codeBuffer.length > 0) {
                while (codeBuffer.length > 0 && codeBuffer[codeBuffer.length - 1] === '') codeBuffer.pop()
                const codeBlock = flushCodeBuffer()
                if (codeBlock && currentQuestion) {
                    currentQuestion.question += '\n' + codeBlock
                }
            }

            // ── Flush math buffer ketika ada konten non-rumus yang nyata ───
            if (mathBuffer.length > 0) {
                while (mathBuffer.length > 0 && mathBuffer[mathBuffer.length - 1] === '') mathBuffer.pop()
                const mathBlock = flushMathBuffer()
                if (mathBlock && currentQuestion) {
                    currentQuestion.question += '\n' + mathBlock
                }
            }

            if (!text && images.length === 0) continue

            const answerMatch = text.match(/Kunci\s*:\s*([A-Z0-9]+(?:\s*,\s*[A-Z0-9]+)*)/i)
            const typeMatch   = text.match(/Tipe\s*:\s*(radio|checkbox|rating|text|file)/i)

            if (answerMatch) text = text.replace(answerMatch[0], '').trim()
            if (typeMatch)   text = text.replace(typeMatch[0], '').trim()

            const isExplicitQuestion = numId === '1' && ilvl === '0'
            const isExplicitOption   = (numId === '1' && ilvl === '1') || numId === '2'
            const isManualQuestion   = /^\d+[\.\)]/.test(text)
            const isManualOption     = /^[a-hA-H][\.\)]/.test(text)

            // Metadata-only baris (Kunci/Tipe kosong setelah strip)
            if (!text && images.length === 0) {
                if (currentQuestion) {
                    if (answerMatch) currentQuestion.answer = answerMatch[1]
                    if (typeMatch)   currentQuestion.type   = typeMatch[1].toLowerCase()
                }
                continue
            }

            if (isExplicitQuestion || (isManualQuestion && (!currentQuestion || currentQuestion.options.length > 0 || currentQuestion.type !== null))) {
                finishQuestion()
                currentQuestion = {
                    question: text.replace(/^\d+[\.\)]\s*/, ''),
                    image,
                    images: extraImages,
                    type:   typeMatch  ? typeMatch[1].toLowerCase()  : null,
                    answer: answerMatch ? answerMatch[1] : null,
                    options: [],
                }
                continue
            }

            if (!currentQuestion) {
                currentQuestion = {
                    question: text,
                    image,
                    images: extraImages,
                    type:   typeMatch  ? typeMatch[1].toLowerCase()  : null,
                    answer: answerMatch ? answerMatch[1] : null,
                    options: [],
                }
                continue
            }

            if (answerMatch) currentQuestion.answer = answerMatch[1]
            if (typeMatch)   currentQuestion.type   = typeMatch[1].toLowerCase()

            if (isExplicitOption || isManualOption) {
                const optVal = isManualOption ? text.replace(/^[a-hA-H][\.\)]\s*/, '') : text
                if (optVal || image) {
                    currentQuestion.options.push({ value: optVal, image })
                }
                for (const extraImg of extraImages) {
                    currentQuestion.options.push({ value: '', image: extraImg })
                }
                continue
            }

            // Paragraf lanjutan (bukan soal baru, bukan opsi)
            if (currentQuestion.options.length > 0) {
                const lastOpt = currentQuestion.options[currentQuestion.options.length - 1]
                if (image && !lastOpt.image) {
                    lastOpt.image = image
                    if (text) lastOpt.value += (lastOpt.value ? '\n' : '') + text
                } else if (image && lastOpt.image) {
                    currentQuestion.options.push({ value: text, image })
                } else if (text) {
                    lastOpt.value += (lastOpt.value ? '\n' : '') + text
                }
                for (const extraImg of extraImages) {
                    currentQuestion.options.push({ value: '', image: extraImg })
                }
            } else {
                if (text) currentQuestion.question += '\n' + text
                if (image && !currentQuestion.image) {
                    currentQuestion.image = image
                } else if (image) {
                    currentQuestion.images = [...(currentQuestion.images ?? []), image]
                }
                for (const extraImg of extraImages) {
                    currentQuestion.images = [...(currentQuestion.images ?? []), extraImg]
                }
            }
        }

        // Flush sisa code buffer setelah loop selesai
        if (codeBuffer.length > 0) {
            const codeBlock = flushCodeBuffer()
            if (codeBlock && currentQuestion) {
                currentQuestion.question += '\n' + codeBlock
            }
        }

        // Flush sisa math buffer setelah loop selesai
        if (mathBuffer.length > 0) {
            const mathBlock = flushMathBuffer()
            if (mathBlock && currentQuestion) {
                currentQuestion.question += '\n' + mathBlock
            }
        }

        finishQuestion()

        if (finalParsedSoal.length === 0) {
            throw new BadRequestException('Tidak ada soal yang ditemukan di dokumen DOCX.')
        }

        return this.createSoalAndOption(form_slug, finalParsedSoal)
    }

    // Get Soal From Form
    async getSoalByForm(id: number, is_random: boolean) {
        const getSoal = await this.knexService.connection("soal")
            .select("*")
            .where("form_id", id)

        function shuffleArray(array) {
            const arr = [...array]
            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [arr[i], arr[j]] = [arr[j], arr[i]]
            }
            return arr
        }

        const soalId = getSoal.map((soal) => soal.id)
        const getOption = await this.knexService.connection("soal_option")
            .select("*")
            .whereIn("soal_id", soalId)

        const grouped = getSoal.reduce((acc, row) => {
            if (!acc[row.page]) {
                acc[row.page] = {
                    page: row.page,
                    soal: []
                }
            }

            let options = getOption.filter((option) => option.soal_id == row.id)
            if (is_random) {
                options = shuffleArray(options)
            }
            acc[row.page].soal.push({
                id: row.id,
                question: row.question,
                type: row.type,
                image: row.image,
                audio: row.audio,
                score: row.score,
                options: options
            })

            return acc
        }, {})

        const result = Object.values(grouped) as Array<{ page: number, soal: any[] }>

        return result
            .sort((a, b) => (a.page ?? 1) - (b.page ?? 1))
            .map((pageGroup) => ({
                ...pageGroup,
                soal: is_random ? shuffleArray(pageGroup.soal) : pageGroup.soal
            }))
    }

    // Create Soal And Option
    async createSoalAndOption(form_slug, body: any) {
        if (!body) throw new BadRequestException("Isi Yang Benar")

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
                            image: soal.image ?? null,
                            audio: soal.audio ?? null,
                            page: soal.page
                        })
                        .returning(['id', 'question', 'type', 'image', 'audio', 'page'])

                    if (!optionTypes.includes(soal.type)) return insertSoal

                    const optionList = Array.isArray(options) ? options : (options ? [options] : [])

                    const payloadSoalOption = optionList.map((optionValue, idx) => ({
                        soal_id: insertSoal.id,
                        image: optionValue.image ?? null,
                        value: optionValue.value,
                        is_correct: optionList[idx]?.is_correct ?? false
                    }))

                    // PENCEGAHAN ERROR "The query is empty":
                    // Jika array payload kosong, kembalikan objek tanpa query insert
                    if (payloadSoalOption.length === 0) {
                        return {
                            soal: insertSoal,
                            options: []
                        }
                    }

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

        delete soal.image_filename
        delete soal.audio_filename
        if (!soal.image) {
            delete soal.image
        }
        if (!soal.audio) {
            delete soal.audio
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
                        is_correct: Boolean(e.is_correct)
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