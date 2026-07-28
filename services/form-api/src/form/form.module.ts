import { Module } from '@nestjs/common';
import { FormService } from './form.service';
import { FormController } from './form.controller';
import { KnexModule } from 'src/database/knex.module';

@Module({
  imports: [KnexModule],
  controllers: [FormController],
  providers: [FormService],
})
export class FormModule {}
