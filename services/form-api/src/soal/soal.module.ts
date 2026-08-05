import { Module } from '@nestjs/common';
import { SoalService } from './soal.service';
import { SoalController } from './soal.controller';
import { KnexModule } from 'src/database/knex.module';

@Module({
  imports: [KnexModule],
  controllers: [SoalController],
  providers: [SoalService],
  exports: [SoalService]
})
export class SoalModule {}
