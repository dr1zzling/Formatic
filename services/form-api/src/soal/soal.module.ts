import { Module } from '@nestjs/common';
import { SoalService } from './soal.service';
import { SoalController } from './soal.controller';
import { KnexModule } from '../database/knex.module';
import { FormEventsGateway } from '../form/form-events.gateway';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [KnexModule, JwtModule],
  controllers: [SoalController],
  providers: [SoalService, FormEventsGateway],
  exports: [SoalService, FormEventsGateway]
})
export class SoalModule {}

