import { Module } from '@nestjs/common';
import { FormModule } from './form/form.module';
import { SoalModule } from './soal/soal.module';
import { SubmitModule } from './submit/submit.module';
import { MonitoringModule } from './monitoring/monitoring.module';
import { KategoriModule } from './kategori/kategori.module';

@Module({
  imports: [FormModule, SoalModule, SubmitModule, MonitoringModule, KategoriModule]
})
export class AppModule {}
