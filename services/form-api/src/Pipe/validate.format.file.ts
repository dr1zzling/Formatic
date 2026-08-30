import { FileValidator } from '@nestjs/common';

export class CustomFileTypeValidator extends FileValidator<{ fileType: RegExp }> {
  isValid(file: Express.Multer.File): boolean {
    if (!file || !file.mimetype) return false
    return this.validationOptions.fileType.test(file.mimetype)
  }

  buildErrorMessage(): string {
    return `Format file tidak valid. Hanya menerima ${this.validationOptions.fileType}`
  }
}