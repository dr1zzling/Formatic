import { Module } from '@nestjs/common';
import { FormService } from './form.service';
import { FormController } from './form.controller';
import { KnexModule } from '../database/knex.module';
import { AuthModule } from '../guard/jwt.module';
import { SoalModule } from '../soal/soal.module';
import { ValidateIsCreator } from '../Pipe/validate.is.creator';
import { FormEventsGateway } from './form-events.gateway';

@Module({
  imports: [KnexModule, AuthModule, SoalModule],
  controllers: [FormController],
  providers: [FormService, ValidateIsCreator, FormEventsGateway],
  exports: [FormEventsGateway],
})
export class FormModule {}

