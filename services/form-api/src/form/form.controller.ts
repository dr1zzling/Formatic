import { BadRequestException, Body, Controller, Get, Post, Query, Request, UseGuards } from '@nestjs/common';
import { FormService } from './form.service';
import { JwtAuthGuard } from 'src/guard/jwt.auth.guard';
import { ValidateCategoryExist } from 'src/Pipe/validate.category.exist';
import { ValidateFormExist } from 'src/Pipe/validate.form.exist';

@Controller('form')
export class FormController {
  constructor(private formService: FormService) {}

  @Get()
  getAll(){
    return this.formService.getAll()
  }

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

  @Get('/slug/')
  getFormBySlug(@Query('slug') slug: string){
    return this.formService.getFormBySlug(slug)
  }

  @Get('/user')
  @UseGuards(JwtAuthGuard)
  getUserForm(@Request() req){
    return this.formService.getMyForm(req.user)
  }

  @Get('/submit')
  getFormSubmitByForm(@Body('form_id', ValidateFormExist) form_id: string){
    return this.formService.getFormSubmitByForm(Number(form_id))
  }

}
