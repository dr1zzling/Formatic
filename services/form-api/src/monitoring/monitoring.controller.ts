import { BadRequestException, Body, Controller, Get, Patch, Put, Query, Request, UseGuards } from '@nestjs/common';
import { MonitoringService } from './monitoring.service';
import { ValidateFormExist } from 'src/Pipe/validate.form.exist';
import { JwtAuthGuard } from 'src/guard/auth.guard';

@Controller('form/monitoring')
export class MonitoringController {
  constructor(private monitoringService: MonitoringService) {}

  // GET /form/monitoring?form_slug= — list semua peserta + status
  @Get('')
  @UseGuards(JwtAuthGuard)
  monitoringSubmit(
    @Request() req,
    @Query('form_slug', ValidateFormExist) form_slug
  ) {
    return this.monitoringService.monitoringSubmit(req.user, form_slug)
  }

  // PATCH /form/monitoring/progress?form_slug= — responden update posisi halaman/soal
  @Patch('/progress')
  @UseGuards(JwtAuthGuard)
  updateProgress(
    @Request() req,
    @Query('form_slug', ValidateFormExist) form_slug,
    @Body('current_page') current_page: number,
    @Body('current_soal') current_soal: number,
    @Body('total_pages') total_pages: number,
    @Body('total_soal') total_soal: number,
  ) {
    if (current_page === undefined || current_page === null)
      throw new BadRequestException("current_page wajib diisi")
    return this.monitoringService.updateProgress(
      req.user,
      form_slug,
      Number(current_page),
      Number(current_soal ?? 0),
      Number(total_pages ?? 0),
      Number(total_soal ?? 0),
    )
  }

  // PUT /form/monitoring/reset?form_slug= — creator reset user
  @Put('/reset')
  @UseGuards(JwtAuthGuard)
  resetUser(
    @Request() req,
    @Query('form_slug', ValidateFormExist) form_slug,
    @Body('user_id') user_id: string
  ) {
    if (!user_id) throw new BadRequestException("Tidak Ada User Yang Anda Pilih")
    return this.monitoringService.resetUser(req.user, form_slug, Number(user_id))
  }
}
