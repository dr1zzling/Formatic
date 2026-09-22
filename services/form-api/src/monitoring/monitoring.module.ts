import { Module } from '@nestjs/common';
import { MonitoringService } from './monitoring.service';
import { MonitoringController } from './monitoring.controller';
import { KnexModule } from 'src/database/knex.module';
import { ValidateIsCreator } from 'src/Pipe/validate.is.creator';
import { FormModule } from 'src/form/form.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [KnexModule, FormModule, JwtModule],
  controllers: [MonitoringController],
  providers: [MonitoringService, ValidateIsCreator],
})
export class MonitoringModule {}
