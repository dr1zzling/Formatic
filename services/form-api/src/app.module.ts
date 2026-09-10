import { Module } from '@nestjs/common';
import { FormModule } from './form/form.module';
import { SoalModule } from './soal/soal.module';
import { SubmitModule } from './submit/submit.module';
import { MonitoringModule } from './monitoring/monitoring.module';

@Module({
  imports: [FormModule, SoalModule, SubmitModule, MonitoringModule]
})
export class AppModule {}
