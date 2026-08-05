import { BadRequestException, Body, Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { FormService } from './form.service';
import { JwtAuthGuard } from 'src/guard/jwt.auth.guard';
import { ValidateCategoryExist, ValidateCategoryExistByName } from 'src/Pipe/validate.category.exist';
import { ValidateFormExist } from 'src/Pipe/validate.form.exist';
import { SubmitService } from 'src/submit/submit.service';

@Controller('form')
export class FormController {
  constructor(private formService: FormService, private submitService: SubmitService) {}

  // Get All For Development
  @Get()
  getAll(@Query('category', ValidateCategoryExistByName) category: string){
    return this.formService.getAll(category)
  }

  // Create Form
  @Post()
  @UseGuards(JwtAuthGuard)
  createForm(
    @Request() req, 
    @Body('title') title: string,
    @Body('category_id', ValidateCategoryExist) category_id: string)
    {
    if(!title || !category_id) throw new BadRequestException("Isi Yang Benar")
    return this.formService.create(req.user, title, Number(category_id))
  }

  // Get Form By Slug
  @Get('/slug/')
  getFormBySlug(@Query('slug') slug: string){
    return this.formService.getFormBySlug(slug)
  }

  // Get Form That User Create
  @Get('/user')
  @UseGuards(JwtAuthGuard)
  getUserForm(@Request() req){
    return this.formService.getMyForm(req.user)
  }

  // Get My Submit History
  @Get('/submit')
  @UseGuards(JwtAuthGuard)
  getFormSubmitByForm(@Request() req, @Body('form_id', ValidateFormExist) form_id: string){
    return this.formService.getMySubmitForm(req.user, Number(form_id))
  }

  @Get('/:form_id/submit')
  @UseGuards(JwtAuthGuard)
  getAllRespon(@Request() req, @Param('form_id', ValidateFormExist) form_id: string){
    return this.formService.getAllRespon(req.user, Number(form_id))
  }
}
