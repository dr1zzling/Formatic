import { BadRequestException, Body, Controller, Get, Param, Post, Query, Request, UseGuards, ParseIntPipe, UseInterceptors, UploadedFile, UploadedFiles, Delete, Patch, ParseFilePipe, FileTypeValidator, MaxFileSizeValidator, Put } from '@nestjs/common';
import { FormService } from './form.service';
import { JwtAuthGuard } from '../guard/jwt.auth.guard';
import { ValidateFormExist } from '../Pipe/validate.form.exist';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { CustomFileTypeValidator } from '../Pipe/validate.format.file';


@Controller('form')
export class FormController {
  constructor(
    private formService: FormService, 
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
        destination: './uploads/banner',
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
    @Body() body: { title: string; category: string, token_respon: string },
  ) {
    if (!body.title || !body.category) {
      throw new BadRequestException('Judul dan kategori wajib diisi');
    }

    return this.formService.create(req.user, body, banner);
  }

  // Update Form
  @Patch()
  @UseGuards(JwtAuthGuard)
  postPublic(
    @Request() req,
    @Query('form_slug', ValidateFormExist) form_slug: string,
    @Body('status') status: string
  ) {
    return this.formService.postPublic(req.user, form_slug, status)
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

  // Update Role
  @Post('/share')
  @UseGuards(JwtAuthGuard)
  changeRole(
    @Request() req,
    @Query('form_slug', ValidateFormExist) form_slug: string,
    @Body('token_collab') token_collab: string
  ){
    return this.formService.changeRole(req.user, form_slug, token_collab)
  }

  @Put('/time')
  @UseGuards(JwtAuthGuard)
  updateForm(
    @Request() req,
    @Query('form_slug', ValidateFormExist) form_slug: string,
    @Body() body: { duration: number, start_at: number}
  ){
    return this.formService.updateForm(req.user, form_slug, body)
  }
}
