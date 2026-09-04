import { Module } from '@nestjs/common';
import { MonitoringService } from './monitoring.service';
import { MonitoringController } from './monitoring.controller';
import { KnexModule } from 'src/database/knex.module';
import { ValidateIsCreator } from 'src/Pipe/validate.is.creator';

@Module({
  imports: [KnexModule],
  controllers: [MonitoringController],
  providers: [MonitoringService, ValidateIsCreator],
})
export class MonitoringModule {}
