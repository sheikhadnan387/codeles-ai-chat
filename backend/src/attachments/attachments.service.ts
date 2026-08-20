import { Injectable } from '@nestjs/common';
import { UPLOADS_STATIC_PREFIX } from '../common/constants';
import { PrismaService } from '../prisma/prisma.service';
import { AttachmentDto } from './dto/attachment.dto';

@Injectable()
export class AttachmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async saveUploadedFile(file: Express.Multer.File): Promise<AttachmentDto> {
    const attachment = await this.prisma.attachment.create({
      data: {
        fileName: file.originalname,
        fileUrl: `${UPLOADS_STATIC_PREFIX}${file.filename}`,
        mimeType: file.mimetype,
        fileSize: file.size,
      },
    });

    return {
      id: attachment.id,
      fileName: attachment.fileName,
      fileUrl: attachment.fileUrl,
      mimeType: attachment.mimeType,
      fileSize: attachment.fileSize,
    };
  }
}
