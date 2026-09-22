import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { KategoriService } from './kategori.service';
import { JwtAuthGuard } from 'src/guard/auth.guard';

@Controller('kategori')
export class KategoriController {
  constructor(private kategoriService: KategoriService) {}

  @Get('/primary')
  @UseGuards(JwtAuthGuard)
  getPrimaryKategori(){
    return this.kategoriService.getPrimaryKategori()
  }

  @Get('/sub/:primary_kategori_id')
  @UseGuards(JwtAuthGuard)
  getSubKategori(@Param('primary_kategori_id') primary_kategori_id){
    return this.kategoriService.getSubKategori(Number(primary_kategori_id))
  }
}
