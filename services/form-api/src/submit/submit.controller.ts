import { Body, Controller, Get, Post, Query, Req, Request, Res, StreamableFile, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { SubmitService } from './submit.service';
import { ValidateFormExist } from '../Pipe/validate.form.exist';
import { JwtAuthGuard } from '../guard/jwt.auth.guard';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as express from 'express';
import { Readable } from 'stream';

@Controller('form/submit')
export class SubmitController {
  constructor(private submitService: SubmitService) { }

  // Check Token Responden
  @Post('check-token')
  @UseGuards(JwtAuthGuard)
  checkRole(
    @Request() req,
    @Query('form_slug', ValidateFormExist) form_slug,
    @Body('token') token: string
  ) {
    return this.submitService.checkTokenResponden(req.user, form_slug, token)
  }

  // Get All Submit By Form
  @Get()
  @UseGuards(JwtAuthGuard)
  getAllSubmitByForm(
    @Request() req,
    @Query('form_slug', ValidateFormExist) form_slug
  ) {
    return this.submitService.getAllSubmitByForm(req.user, form_slug)
  }

  // Get All Submit Detail By Form
  @Get('/detail')
  @UseGuards(JwtAuthGuard)
  getAllSubmitResponseByForm(
    @Request() req,
    @Query('form_slug', ValidateFormExist) form_slug
  ) {
    return this.submitService.getAllSubmitResponseByForm(req.user, form_slug)
  }

  // Download Excel
  @Get('/export-excel')
  @UseGuards(JwtAuthGuard)
  async exportExcel(
    @Request() req,
    @Query('form_slug', ValidateFormExist) form_slug,
    @Res({ passthrough: true }) res: express.Response,
  ): Promise<StreamableFile> {
    const buffer = await this.submitService.exportSubmitResponseToExcel(req.user, form_slug)

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="Hasil_Submit_${Date.now()}.xlsx"`,
    })

    const stream = Readable.from(buffer);
    return new StreamableFile(stream);
  }

  // Submit jawaban responden
  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FilesInterceptor('files', 20, {
      storage: diskStorage({
        destination: './uploads/answers',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
          cb(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`)
        },
      }),
    }),
  )
  submitForm(
    @Request() req,
    @Query('form_slug', ValidateFormExist) form_slug,
    @Body('data') data: string,
    @UploadedFiles() files: Express.Multer.File[] = [],
  ) {
    return this.submitService.submitForm(req.user, form_slug, data, files)
  }
}
