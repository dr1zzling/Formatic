import { Module } from '@nestjs/common';
import { FormModule } from './form/form.module';
import { SoalModule } from './soal/soal.module';
import { QrCodeModule } from './qr.code/qr.code.module';
import { SubmitModule } from './submit/submit.module';

@Module({
  imports: [FormModule, SoalModule, QrCodeModule, SubmitModule]
})
export class AppModule {}
