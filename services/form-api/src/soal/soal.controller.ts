import { BadRequestException, Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { SoalService } from './soal.service';
import { ValidateFormExist } from 'src/Pipe/validate.form.exist';
import { JwtAuthGuard } from 'src/guard/jwt.auth.guard';

@Controller('form/soal')
export class SoalController {
  constructor(private soalService: SoalService) { }

  @Get('/:id')
  @UseGuards(JwtAuthGuard)
  getSoalByForm(@Param('id', ValidateFormExist) id: string) {
    return this.soalService.getSoalByForm(Number(id))
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  createSoalAndOption(
    @Query('form_slug', ValidateFormExist) form_slug: string,
    @Body() data: any
  ){
    return this.soalService.createSoalAndOption(form_slug, data)
  }

}
