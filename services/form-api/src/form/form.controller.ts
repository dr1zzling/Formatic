import { BadRequestException, Body, Controller, Get, Param, Post, Query, Request, UseGuards, ParseIntPipe, UseInterceptors, UploadedFile, UploadedFiles, Delete, Patch, ParseFilePipe, FileTypeValidator, MaxFileSizeValidator } from '@nestjs/common';
import { FormService } from './form.service';
import { JwtAuthGuard } from 'src/guard/jwt.auth.guard';
import { ValidateFormExist } from 'src/Pipe/validate.form.exist';
import { SubmitService } from 'src/submit/submit.service';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { CustomFileTypeValidator } from 'src/Pipe/validate.format.file';


@Controller('form')
export class FormController {
  constructor(
    private formService: FormService, 
    private submitService: SubmitService
  ) {}

  // Get All Form
  @Get()
  getAllForm() {
    return this.formService.getAll()
  }

  // Get All By Category
  @Get('category')
  getAll(
    @Query('category') category: string
  ) {
    return this.formService.getAllByCategory(category)
  }

  // Get Form By Slug
  @Get('/slug/')
  getFormBySlug(
    @Query('slug') slug: string
  ) {
    return this.formService.getFormBySlug(slug)
  }

  // Create Form
  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('banner', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
      }),
    }),
  )
  createForm(
    @Request() req,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new CustomFileTypeValidator({ fileType: /^image\/(jpeg|png|webp)$/ })
        ],
        fileIsRequired: true
      }),
    )
    banner: Express.Multer.File,
    @Body() body: { title: string; category: string },
  ) {
    if (!body.title || !body.category) {
      throw new BadRequestException('Judul dan kategori wajib diisi');
    }

    return this.formService.create(req.user, body, banner);
  }

  // Update Form
  @Patch()
  @UseGuards(JwtAuthGuard)
  updateForm(
    @Request() req,
    @Query('form_slug', ValidateFormExist) form_slug: string,
    @Body('status') status: string
  ) {
    return this.formService.updateForm(req.user, form_slug, status)
  }

  // Delete Form
  @Delete()
  @UseGuards(JwtAuthGuard)
  deleteForm(
    @Request() req,
    @Query('form_slug', ValidateFormExist) form_slug: string
  ) {
    return this.formService.deleteForm(req.user, form_slug)
  }

  // Get Form That User Create
  @Get('/user')
  @UseGuards(JwtAuthGuard)
  getUserForm(
    @Request() req
  ) {
    return this.formService.getMyForm(req.user)
  }

  // Get My Submit History
  @Get('/submit')
  @UseGuards(JwtAuthGuard)
  getFormSubmitByForm(
    @Request() req,
    @Body('form_id', ValidateFormExist) form_id: string
  ) {
    return this.formService.getMySubmitForm(req.user, Number(form_id))
  }

  // Get All Respon By Form
  @Get('/:form_id/submit')
  @UseGuards(JwtAuthGuard)
  getAllRespon(
    @Request() req,
    @Param('form_id', ValidateFormExist) form_id: string
  ) {
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
      try { parsedBody = JSON.parse(body); } catch (e) { }
    } else if (typeof body?.data === 'string') {
      try { parsedBody = JSON.parse(body.data); } catch (e) { }
    }
    return this.submitService.createSubmitForm(req.user, form_id, parsedBody, files)
  }

}
