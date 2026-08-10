import { Module } from '@nestjs/common';
import { FormModule } from './form/form.module';
import { SoalModule } from './soal/soal.module';
import { QrCodeModule } from './qr.code/qr.code.module';

@Module({
  imports: [FormModule, SoalModule, QrCodeModule]
})
export class AppModule {}
