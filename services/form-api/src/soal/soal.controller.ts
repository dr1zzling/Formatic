import { BadRequestException, Body, Controller, Get, Param, Post } from '@nestjs/common';
import { SoalService } from './soal.service';
import { ValidateFormExist } from 'src/Pipe/validate.form.exist';

@Controller('form/soal')
export class SoalController {
  constructor(private soalService: SoalService) {}
  
  @Get('/:id')
  getSoalByForm(@Param('id', ValidateFormExist) id: string ){
    return this.soalService.getSoalByForm(Number(id))
  }

  @Post('/:id')
  createSoalAndOption(@Param('id', ValidateFormExist) id: string, @Body() data: any){
    return this.soalService.createSoalAndOption(Number(id), data)
  }
}
