import { Controller, Get, Param } from '@nestjs/common';
import { SoalService } from './soal.service';

@Controller('soal/form')
export class SoalController {
  constructor(private soalService: SoalService) {}
  
  @Get('/:id')
  getSoalByForm(@Param('id') id: string ){
    return this.soalService.getSoalByForm(Number(id))
  }
}
