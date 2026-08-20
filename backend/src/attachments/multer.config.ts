import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { Request } from 'express';
import {
  ALLOWED_ATTACHMENT_MIME_TYPES,
  MAX_ATTACHMENT_SIZE_BYTES,
  UPLOADS_DIR,
} from '../common/constants';
import { buildStoredFileName } from './file-storage.util';

type MulterFile = Express.Multer.File;
type MulterFileFilterCallback = (
  error: Error | null,
  acceptFile: boolean,
) => void;
type MulterFileNameCallback = (error: Error | null, filename: string) => void;

function isAllowedMimeType(mimeType: string): boolean {
  return (
    mimeType.startsWith('image/') ||
    ALLOWED_ATTACHMENT_MIME_TYPES.includes(mimeType)
  );
}

export const attachmentMulterOptions = {
  storage: diskStorage({
    destination: UPLOADS_DIR,
    filename: (
      _req: Request,
      file: MulterFile,
      callback: MulterFileNameCallback,
    ) => {
      callback(null, buildStoredFileName(file.originalname));
    },
  }),
  limits: { fileSize: MAX_ATTACHMENT_SIZE_BYTES },
  fileFilter: (
    _req: Request,
    file: MulterFile,
    callback: MulterFileFilterCallback,
  ) => {
    if (!isAllowedMimeType(file.mimetype)) {
      callback(
        new BadRequestException(`Unsupported file type: ${file.mimetype}`),
        false,
      );
      return;
    }
    callback(null, true);
  },
};
