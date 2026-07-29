import { Injectable } from "@nestjs/common";
import * as qr from 'qrcode'

@Injectable()
export class QrCodeService {
    async generateDataUrl(slug: string) : Promise<string> {
        try{
            return await qr.toDataURL(slug)
        }
        catch(err){
            throw new Error('Gagal Membuat QR Code Untuk Data Url')
        }
    }

    async generateBuffer(slug: string) : Promise<Buffer> {
        try{
            return await qr.toBuffer(slug)
        }
        catch(err){
            throw new Error('Gagal Membuat Qr Code untuk Buffer')
        }
    }
}