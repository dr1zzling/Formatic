import { Module } from '@nestjs/common';
import { FormModule } from './form/form.module';
import { SoalModule } from './soal/soal.module';
import { SubmitModule } from './submit/submit.module';
import { MonitoringModule } from './monitoring/monitoring.module';
import { KategoriModule } from './kategori/kategori.module';
import { AuthModule } from './guard/jwt.module';

@Module({
  imports: [FormModule, SoalModule, SubmitModule, MonitoringModule, KategoriModule, AuthModule]
})
export class AppModule {}
