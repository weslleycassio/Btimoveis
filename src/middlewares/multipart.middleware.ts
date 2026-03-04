import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/app-error';

type MemoryFile = {
  fieldname: string;
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

declare global {
  namespace Express {
    interface Request {
      files?: MemoryFile[];
    }
  }
}

function parseBoundary(contentType: string): string | null {
  const match = contentType.match(/boundary=(.+)$/i);
  if (!match) {
    return null;
  }

  return match[1].replace(/^"|"$/g, '');
}

export function memoryMultipartArray(fieldName: string, maxCount: number) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const contentType = req.headers['content-type'];

    if (!contentType || !contentType.includes('multipart/form-data')) {
      next(new AppError('Content-Type deve ser multipart/form-data', 400));
      return;
    }

    const boundary = parseBoundary(contentType);

    if (!boundary) {
      next(new AppError('Boundary multipart inválido', 400));
      return;
    }

    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });

    req.on('error', () => {
      next(new AppError('Falha ao ler upload multipart', 400));
    });

    req.on('end', () => {
      try {
        const bodyBuffer = Buffer.concat(chunks);
        const boundaryToken = Buffer.from(`--${boundary}`);
        const parts = bodyBuffer
          .toString('binary')
          .split(boundaryToken.toString('binary'))
          .slice(1, -1);

        const files: MemoryFile[] = [];

        for (const rawPart of parts) {
          const cleaned = rawPart.replace(/^\r\n/, '').replace(/\r\n$/, '');
          const sepIndex = cleaned.indexOf('\r\n\r\n');
          if (sepIndex === -1) {
            continue;
          }

          const headerRaw = cleaned.slice(0, sepIndex);
          let payloadRaw = cleaned.slice(sepIndex + 4);
          payloadRaw = payloadRaw.replace(/\r\n$/, '');

          const headers = headerRaw.split('\r\n');
          const disposition = headers.find((h) => h.toLowerCase().startsWith('content-disposition'));

          if (!disposition) {
            continue;
          }

          const nameMatch = disposition.match(/name="([^"]+)"/i);
          const fileNameMatch = disposition.match(/filename="([^"]*)"/i);

          if (!nameMatch || nameMatch[1] !== fieldName || !fileNameMatch || !fileNameMatch[1]) {
            continue;
          }

          const mimeHeader = headers.find((h) => h.toLowerCase().startsWith('content-type'));
          const mimeType = mimeHeader?.split(':')[1]?.trim() || 'application/octet-stream';
          const fileBuffer = Buffer.from(payloadRaw, 'binary');

          files.push({
            fieldname: fieldName,
            originalname: fileNameMatch[1],
            mimetype: mimeType,
            size: fileBuffer.length,
            buffer: fileBuffer,
          });
        }

        if (files.length > maxCount) {
          next(new AppError(`Máximo de ${maxCount} imagens por requisição`, 400));
          return;
        }

        req.files = files;
        next();
      } catch {
        next(new AppError('Falha ao processar multipart/form-data', 400));
      }
    });
  };
}
