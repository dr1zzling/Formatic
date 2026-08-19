import { BadRequestException, Body, Controller, Get, Param, Post, Query, UploadedFile, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { SoalService } from './soal.service';
import { ValidateFormExist } from '../Pipe/validate.form.exist';
import { JwtAuthGuard } from '../guard/jwt.auth.guard';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('form/soal')
export class SoalController {
  constructor(private soalService: SoalService) { }

  @Get('/:id')
  @UseGuards(JwtAuthGuard)
  getSoalByForm(@Param('id', ValidateFormExist) id: string) {
    return this.soalService.getSoalByForm(Number(id))
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'soal_images', maxCount: 10 },
        { name: 'option_images', maxCount: 50 },
      ],
      {
        storage: diskStorage({
          destination: './uploads/soal',
          filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
            cb(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`)
          },
        }),
      },
    ),
  )
  async createSoalAndOption(
    @Query('form_slug', ValidateFormExist) form_slug: any,
    @Body('data') dataRaw: string,
    @UploadedFiles() 
    files?: {
      soal_images?: Express.Multer.File[]
      option_images?: Express.Multer.File[]
    },
  ) {
    let parsedData: any
    try {
      parsedData = typeof dataRaw === 'string' ? JSON.parse(dataRaw) : dataRaw
    } catch (error) {
      throw new BadRequestException('Format JSON pada field "data" tidak valid!')
    }

    const listSoal = Array.isArray(parsedData) ? parsedData : [parsedData]

    if (files) {
      listSoal.forEach((item) => {
        if (item.soal && item.soal.image_filename) {
          const matchSoalFile = files.soal_images?.find(
            (f) => f.originalname === item.soal.image_filename,
          )
          if (matchSoalFile) {
            item.soal.image = `/uploads/soal/${matchSoalFile.filename}`
          }
        }

        if (item.options && Array.isArray(item.options)) {
          item.options.forEach((opt: any) => {
            if (opt.image_filename) {
              const matchOptionFile = files.option_images?.find(
                (f) => f.originalname === opt.image_filename,
              )
              if (matchOptionFile) {
                opt.image = `/uploads/soal/${matchOptionFile.filename}`
              }
            }
          })
        }
      })
    }

    return this.soalService.createSoalAndOption(form_slug, listSoal)
  }

}
