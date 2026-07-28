import { Controller, Get, Param } from '@nestjs/common';
import { SoalService } from './soal.service';
import { ValidateFormExist } from 'src/Pipe/validate.form.exist';

@Controller('form/soal')
export class SoalController {
  constructor(private soalService: SoalService) {}
  
  @Get('/:id')
  getSoalByForm(@Param('id', ValidateFormExist) id: string ){
    return this.soalService.getSoalByForm(Number(id))
  }
}
