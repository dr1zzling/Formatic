import { BadRequestException, Body, Controller, Get, Post, Req, Request, UseGuards } from '@nestjs/common';
import { FormService } from './form.service';
import { JwtAuthGuard } from 'src/guard/jwt.auth.guard';

@Controller('form')
export class FormController {
  constructor(private formService: FormService) {}

  @Get()
  getAll(){
    return this.formService.getAll()
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  createForm(@Request() req, @Body() data: {title: string}){
    if(!data.title) throw new BadRequestException("Isi Yang Benar")
    return this.formService.create(req.user, data)
  }

  @Get('/user')
  @UseGuards(JwtAuthGuard)
  getUserForm(@Request() req){
    return this.formService.getUserForm(req.user)
  }

}
