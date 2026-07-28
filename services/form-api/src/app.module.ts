import { Module } from '@nestjs/common';
import { FormModule } from './form/form.module';

@Module({
  imports: [FormModule]
})
export class AppModule {}
