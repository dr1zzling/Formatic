import { Module } from '@nestjs/common';
import { FormService } from './form.service';
import { FormController } from './form.controller';
import { KnexModule } from '../database/knex.module';
import { SoalModule } from '../soal/soal.module';
import { ValidateIsCreator } from '../Pipe/validate.is.creator';
import { FormEventsGateway } from './form-events.gateway';
import { KategoriService } from 'src/kategori/kategori.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [KnexModule, SoalModule, JwtModule],
  controllers: [FormController],
  providers: [FormService, ValidateIsCreator, FormEventsGateway, KategoriService],
  exports: [FormEventsGateway],
})
export class FormModule {}

