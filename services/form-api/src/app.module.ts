import { Module } from '@nestjs/common';
import { FormModule } from './form/form.module';
import { SoalModule } from './soal/soal.module';

@Module({
  imports: [FormModule, SoalModule]
})
export class AppModule {}
