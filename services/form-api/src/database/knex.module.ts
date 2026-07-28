import { Module } from '@nestjs/common';
import { KnexService } from './knex.service';

@Module({
  exports: [KnexService],
  providers: [KnexService],
})
export class KnexModule {}
