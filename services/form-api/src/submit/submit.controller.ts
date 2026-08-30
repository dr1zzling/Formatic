import { Body, Controller, Get, Post, Query, Request, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { SubmitService } from './submit.service';
import { ValidateFormExist } from '../Pipe/validate.form.exist';
import { JwtAuthGuard } from '../guard/jwt.auth.guard';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('form/submit')
export class SubmitController {
    constructor(private submitService: SubmitService) {}

    // Check Token Responden
    @Post('check-token')
    @UseGuards(JwtAuthGuard)
    checkRole(
      @Request() req,
      @Query('form_slug', ValidateFormExist) form_slug ,
      @Body('token') token: string 
    ){
      return this.submitService.checkTokenResponden(req.user, form_slug, token)
    }

    // Get All Submit By Form
    @Get()
    @UseGuards(JwtAuthGuard)
    getAllSubmitByForm(
      @Request() req,
      @Query('form_slug', ValidateFormExist) form_slug
    ){
        return this.submitService.getAllSubmitByForm(req.user, form_slug)
    }

    // Get All Submit Detail By Form
    @Get('/detail')
    @UseGuards(JwtAuthGuard)
    getAllSubmitResponseByForm(
      @Request() req,
      @Query('form_slug', ValidateFormExist) form_slug
    ){
      return this.submitService.getAllSubmitResponseByForm(req.user, form_slug)
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
