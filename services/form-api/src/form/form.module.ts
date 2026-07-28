import { Module } from '@nestjs/common';
import { FormService } from './form.service';
import { FormController } from './form.controller';
import { KnexModule } from 'src/database/knex.module';
import { AuthModule } from 'src/guard/jwt.module';

@Module({
  imports: [KnexModule, AuthModule],
  controllers: [FormController],
  providers: [FormService],
})
export class FormModule {}
