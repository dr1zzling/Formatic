import { BadRequestException, Body, Controller, Get, Post, Query, Request, UseGuards } from '@nestjs/common';
import { FormService } from './form.service';
import { JwtAuthGuard } from 'src/guard/jwt.auth.guard';
import { ValidateCategoryExist, ValidateCategoryExistByName } from 'src/Pipe/validate.category.exist';
import { ValidateFormExist } from 'src/Pipe/validate.form.exist';

@Controller('form')
export class FormController {
  constructor(private formService: FormService) {}

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


  @Get('/submit')
  @UseGuards(JwtAuthGuard)
  getFormSubmitByForm(@Request() req, @Body('form_id', ValidateFormExist) form_id: string){
    return this.formService.getMySubmitForm(req.user, Number(form_id))
  }

}
