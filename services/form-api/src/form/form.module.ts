import { Module } from '@nestjs/common';
import { FormService } from './form.service';
import { FormController } from './form.controller';
import { KnexModule } from 'src/database/knex.module';
import { AuthModule } from 'src/guard/jwt.module';
import { SoalModule } from 'src/soal/soal.module';
import { ValidateIsCreator } from 'src/Pipe/validate.is.creator';

@Module({
  imports: [KnexModule, AuthModule, SoalModule],
  controllers: [FormController],
  providers: [FormService, ValidateIsCreator],
})
export class FormModule {}
