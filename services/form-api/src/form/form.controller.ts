import { BadRequestException, Body, Controller, Get, Param, Post, Query, Request, UseGuards, ParseIntPipe, UseInterceptors, UploadedFile, UploadedFiles } from '@nestjs/common';
import { FormService } from './form.service';
import { JwtAuthGuard } from 'src/guard/jwt.auth.guard';
import { ValidateCategoryExist, ValidateCategoryExistByName } from 'src/Pipe/validate.category.exist';
import { ValidateFormExist } from 'src/Pipe/validate.form.exist';
import { SubmitService } from 'src/submit/submit.service';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';


@Controller('form')
export class FormController {
  constructor(private formService: FormService, private submitService: SubmitService) { }

  // Get All For Development
  @Get()
  getAll(@Query('category', ValidateCategoryExistByName) category: string) {
    return this.formService.getAll(category)
  }

  // Create Form
  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('banner', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
      },
    }),
  }))
  createForm(
    @Request() req,
    @Body('title') title: string,
    @UploadedFile() banner: Express.Multer.File,
    @Body('category_id', ValidateCategoryExist) category_id: string) {
    if (!title || !category_id) throw new BadRequestException("Isi Yang Benar")

    return this.formService.create(req.user, title, Number(category_id), banner)
  }

  // Get Form By Slug
  @Get('/slug/')
  getFormBySlug(@Query('slug') slug: string) {
    return this.formService.getFormBySlug(slug)
  }

  // Get Form That User Create
  @Get('/user')
  @UseGuards(JwtAuthGuard)
  getUserForm(@Request() req) {
    return this.formService.getMyForm(req.user)
  }

  // Get My Submit History
  @Get('/submit')
  @UseGuards(JwtAuthGuard)
  getFormSubmitByForm(
    @Request() req,
    @Body('form_id', ValidateFormExist) form_id: string) {
    return this.formService.getMySubmitForm(req.user, Number(form_id))
  }

  // Get All Respon By Form
  @Get('/:form_id/submit')
  @UseGuards(JwtAuthGuard)
  getAllRespon(
    @Request() req,
    @Param('form_id', ValidateFormExist) form_id: string) {
    return this.formService.getAllRespon(req.user, Number(form_id))
  }

  // Create Form Submit
  @Post('/submit/:form_id')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: diskStorage({
        destination: './uploads', 
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
      }),
    })
  )
  @UseGuards(JwtAuthGuard)
  async createSubmitForm(
    @Request() req,
    @Param('form_id', ParseIntPipe, ValidateFormExist) form_id: number,
    @Body() body: any,
    @UploadedFiles() files: Express.Multer.File[]
  ) {
    let parsedBody = body;
    if (typeof body === 'string') {
      try { parsedBody = JSON.parse(body); } catch (e) {}
    } else if (typeof body?.data === 'string') {
      try { parsedBody = JSON.parse(body.data); } catch (e) {}
    }
    return this.submitService.createSubmitForm(req.user, form_id, parsedBody, files)
  }

}
