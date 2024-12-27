import { Injectable, PipeTransform, BadRequestException } from '@nestjs/common';
import { Express } from 'express';

interface FileSizeLimits {
  video: number; // Max size in MB for videos
  thumbnail: number; // Max size in MB for thumbnails
}

@Injectable()
export class FileSizeValidationPipe implements PipeTransform {
  constructor(private readonly sizeLimits: FileSizeLimits) {}

  transform(files: { [key: string]: Express.Multer.File[] }) {
    for (const [fieldname, fileArray] of Object.entries(files)) {
      const maxSizeInBytes = this.sizeLimits[fieldname] * 1024 * 1024;

      // Check if the fieldname has a size limit
      if (!maxSizeInBytes) {
        throw new BadRequestException(`Unexpected file field: ${fieldname}`);
      }

      for (const file of fileArray) {
        const { size, mimetype } = file;

        // Validate file size
        if (size > maxSizeInBytes) {
          throw new BadRequestException(
            `${fieldname} size must not exceed ${this.sizeLimits[fieldname]} MB`,
          );
        }

        // Validate MIME type
        const validMimeTypes =
          fieldname === 'video'
            ? ['video/mp4', 'video/x-matroska'] // MIME types for mp4 and mkv
            : ['image/jpeg', 'image/png']; // MIME types for jpg, jpeg, and png

        if (!validMimeTypes.includes(mimetype)) {
          throw new BadRequestException(
            `${fieldname} must have a valid MIME type: ${validMimeTypes.join(', ')}`,
          );
        }
      }
    }

    return files;
  }
}
