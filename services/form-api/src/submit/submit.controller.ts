import { BadRequestException, Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { SubmitService } from './submit.service';

@Controller('form/soal')
export class SoalController {
  constructor(private submitService: SubmitService) {}

  
}
