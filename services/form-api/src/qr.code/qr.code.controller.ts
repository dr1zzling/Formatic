import { Controller, Get, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { QrCodeService } from './qr.code.service';

@Controller('qrcode')
export class QrCodeController {
  constructor(private qrCodeService: QrCodeService) {}

  @Get('json')
  async getJsonQr(@Query('slug') slug: string){
    const payload = slug || 'https://example.com'
    const qrDataUrl = await this.qrCodeService.generateDataUrl(payload)
    return { qrCode: qrDataUrl}
  }

  @Get('image')
  async getImageQr(@Query('slug') slug: string, @Res() res: Response){
    const payload = slug || 'https://example.com'
    const buffer = await this.qrCodeService.generateBuffer(payload)

    res.setHeader('Content-Type', 'image/png')
    res.send(buffer)
  }
}
