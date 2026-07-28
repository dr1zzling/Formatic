import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { FormService } from './form.service';
import { JwtAuthGuard } from 'src/guard/jwt.auth.guard';

@Controller('form')
export class FormController {
  constructor(private formService: FormService) {}

  @Get()
  getAll(){
    return this.formService.getAll()
  }

  @Get('/user')
  @UseGuards(JwtAuthGuard)
  getUserForm(@Request() req){
    return this.formService.getUserForm(req.user)
  }
}
