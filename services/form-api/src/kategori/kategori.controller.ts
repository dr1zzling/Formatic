import { Controller, Get, Param } from '@nestjs/common';
import { KategoriService } from './kategori.service';

@Controller('kategori')
export class KategoriController {
  constructor(private kategoriService: KategoriService) {}

  @Get('/primary')
  getPrimaryKategori(){
    return this.kategoriService.getPrimaryKategori()
  }

  @Get('/sub/:primary_kategori_id')
  getSubKategori(@Param('primary_kategori_id') primary_kategori_id){
    return this.kategoriService.getSubKategori(Number(primary_kategori_id))
  }
}
