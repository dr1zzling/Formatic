import { Module } from '@nestjs/common';
import { KategoriService } from './kategori.service';
import { KategoriController } from './kategori.controller';
import { KnexModule } from 'src/database/knex.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [KnexModule, JwtModule],
  controllers: [KategoriController],
  providers: [KategoriService],
})
export class KategoriModule {}
