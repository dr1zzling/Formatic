import { Module } from '@nestjs/common';
import { KnexModule } from 'src/database/knex.module';
import { SubmitService } from './submit.service';

@Module({
  imports: [KnexModule],
  providers: [SubmitService],
  exports: [SubmitService],
})
export class SubmitModule {}
