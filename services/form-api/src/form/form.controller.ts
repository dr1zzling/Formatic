import { BadRequestException, Body, Controller, Get, Param, Post, Query, Request, UseGuards, ParseIntPipe, UseInterceptors, UploadedFile, UploadedFiles, Delete, Patch, ParseFilePipe, FileTypeValidator, MaxFileSizeValidator, Put } from '@nestjs/common';
import { FormService } from './form.service';
import { ValidateFormExist } from '../Pipe/validate.form.exist';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { CustomFileTypeValidator } from '../Pipe/validate.format.file';
import { JwtAuthGuard } from 'src/guard/auth.guard';


@Controller('form')
export class FormController {
  constructor(
    private formService: FormService, 
  ) {}

  // Get All Form
  @Get()
  @UseGuards(JwtAuthGuard)
  getAllForm(
    @Request() req
  ) {
    return this.formService.getAll()
  }

  // Get All By Category
  @Get('category')
  @UseGuards(JwtAuthGuard)
  getAll(
    @Request() req,
    @Query('category') category: string
  ) {
    return this.formService.getAllByCategory(category)
  }

  // Get Form By Slug
  @Get('/slug/')
  @UseGuards(JwtAuthGuard)
  getFormBySlug(
    @Request() req,
    @Query('slug') slug: string
  ) {
    return this.formService.getFormBySlug(req.user, slug)
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
        fileIsRequired: false
      }),
    )
    banner: Express.Multer.File,
    @Body() body: { title: string, sub_kategori: number, token_respon: string, theme_color: string },
  ) {
    if (!body.title || !body.sub_kategori) {
      throw new BadRequestException('Judul dan kategori wajib diisi');
    }

    return this.formService.create(req.user, body, banner);
  }

  // Post Public Form
  @Put()
  @UseGuards(JwtAuthGuard)
  postPublic(
    @Request() req,
    @Query('form_slug', ValidateFormExist) form_slug: string,
    @Body('status') status: string
  ) {
    return this.formService.postPublic(req.user, form_slug, status)
  }

  // Update Banner Form
  @Patch('/banner')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('banner', {
      storage: diskStorage({
        destination: './uploads/banner',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `banner-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
        if (allowed.includes(extname(file.originalname).toLowerCase())) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Format file tidak didukung. Gunakan JPG, PNG, atau WEBP.'), false);
        }
      },
      limits: { fileSize: 5 * 1024 * 1024 }, // max 5MB
    }),
  )
  updateBanner(
    @Request() req,
    @Query('form_slug', ValidateFormExist) form_slug,
    @UploadedFile() banner: Express.Multer.File,
  ) {
    if (!banner) throw new BadRequestException('File banner wajib diunggah');
    return this.formService.updateBanner(req.user, form_slug, banner);
  }

  // Delete Banner Form
  @Delete('/banner')
  @UseGuards(JwtAuthGuard)
  deleteBanner(
    @Request() req,
    @Query('form_slug', ValidateFormExist) form_slug,
  ) {
    return this.formService.deleteBanner(req.user, form_slug);
  }

  // Update Form Setting
  @Patch('/setting')
  @UseGuards(JwtAuthGuard)
  updateForm(
    @Request() req,
    @Query('form_slug', ValidateFormExist) form_slug: string,
    @Body() body: { token_respon: string, duration: number, start_at: number, is_random: boolean, theme_color: string}
  ){
    return this.formService.updateFormSetting(req.user, form_slug, body)
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

}
