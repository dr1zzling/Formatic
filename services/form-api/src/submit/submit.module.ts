import { Module } from '@nestjs/common';
import { KnexModule } from '../database/knex.module';
import { SubmitService } from './submit.service';
import { SubmitController } from './submit.controller';
import { ValidateIsCreator } from '../Pipe/validate.is.creator';
import { SoalModule } from '../soal/soal.module';
import { JwtModule } from '@nestjs/jwt/dist/jwt.module';

@Module({
  imports: [KnexModule, SoalModule, JwtModule],
  controllers: [SubmitController],
  providers: [SubmitService, ValidateIsCreator],
  exports: [SubmitService],
})
export class SubmitModule {}
