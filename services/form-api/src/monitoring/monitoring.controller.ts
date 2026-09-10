import { BadRequestException, Body, Controller, Get, Put, Query, Request, UseGuards } from '@nestjs/common';
import { MonitoringService } from './monitoring.service';
import { JwtAuthGuard } from 'src/guard/jwt.auth.guard';
import { ValidateFormExist } from 'src/Pipe/validate.form.exist';

@Controller('form/monitoring')
export class MonitoringController {
  constructor(private monitoringService: MonitoringService) {}

  @Get('')
  @UseGuards(JwtAuthGuard)
  monitoringSubmit(
    @Request() req,
    @Query('form_slug', ValidateFormExist) form_slug
  ) {
    return this.monitoringService.monitoringSubmit(req.user, form_slug)
  }

  @Put('/reset')
  @UseGuards(JwtAuthGuard)
  resetUser(
    @Request() req,
    @Query('form_slug', ValidateFormExist) form_slug,
    @Body('user_id') user_id: string
  ){
    if(!user_id) throw new BadRequestException("Tidak Ada User Yang Anda Pilih")
    return this.monitoringService.resetUser(req.user, form_slug, Number(user_id))
  }
}
