import { Module } from '@nestjs/common';
import { FormService } from './form.service';
import { FormController } from './form.controller';
import { KnexModule } from 'src/database/knex.module';
import { AuthModule } from 'src/guard/jwt.module';
import { SubmitModule } from '../submit/submit.module';
import { SoalModule } from 'src/soal/soal.module';

@Module({
  imports: [KnexModule, AuthModule, SubmitModule, SoalModule],
  controllers: [FormController],
  providers: [FormService],
})
export class FormModule {}
