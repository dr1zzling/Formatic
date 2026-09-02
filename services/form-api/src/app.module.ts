import { Module } from '@nestjs/common';
import { FormModule } from './form/form.module';
import { SoalModule } from './soal/soal.module';
import { SubmitModule } from './submit/submit.module';

@Module({
  imports: [FormModule, SoalModule, SubmitModule]
})
export class AppModule {}
