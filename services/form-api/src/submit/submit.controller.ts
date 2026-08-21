import { BadRequestException, Body, Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { SubmitService } from './submit.service';
import { ValidateFormExist } from '../Pipe/validate.form.exist';
import { JwtAuthGuard } from '../guard/jwt.auth.guard';
import { AuthGuard } from '@nestjs/passport';

@Controller('form/submit')
export class SubmitController {
    constructor(private submitService: SubmitService) {}

    // Check Token Responden
    @Post('check-token')
    @UseGuards(JwtAuthGuard)
    checkRole(
      @Request() req,
      @Query('form_slug', ValidateFormExist) form_slug ,
      @Body('token') token: string 
    ){
      return this.submitService.checkTokenResponden(req.user, form_slug, token)
    }

    // Get All Submit By Form
    @Get()
    @UseGuards(JwtAuthGuard)
    getAllSubmitByForm(
      @Request() req,
      @Query('form_slug', ValidateFormExist) form_slug
    ){
        return this.submitService.getAllSubmitByForm(req.user, form_slug)
    }

    // Get All Submit Detail By Form
    @Get('/detail')
    @UseGuards(JwtAuthGuard)
    getAllSubmitResponseByForm(
      @Request() req,
      @Query('form_slug', ValidateFormExist) form_slug
    ){
      return this.submitService.getAllSubmitResponseByForm(req.user, form_slug)
    }
}
