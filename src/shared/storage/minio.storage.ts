import crypto from 'crypto';
import path from 'path';
import { env } from '../../config/env';
import { AppError } from '../../utils/app-error';

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

type UploadImageInput = {
  buffer: Buffer;
  mimeType: string;
  imovelId: string;
  originalName: string;
};

function getBaseEndpoint(): string {
  const protocol = env.MINIO_USE_SSL ? 'https' : 'http';
  return `${protocol}://${env.MINIO_ENDPOINT}:${env.MINIO_PORT}`;
}

function slugifyFileName(fileName: string): string {
  const parsed = path.parse(fileName);
  const base = parsed.name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

  return base || 'imagem';
}

function resolveExtension(originalName: string, mimeType: string): string {
  const extByMimeType: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };

  const ext = path.extname(originalName).replace('.', '').toLowerCase();
  if (ext) {
    return ext;
  }

  return extByMimeType[mimeType] ?? 'bin';
}

function sha256Hex(data: Buffer | string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

function hmac(key: Buffer | string, data: string): Buffer {
  return crypto.createHmac('sha256', key).update(data).digest();
}

function encodeS3Path(resourcePath: string): string {
  return resourcePath
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

async function signedRequest(
  method: 'PUT' | 'DELETE' | 'HEAD',
  resourcePath: string,
  body?: Buffer,
  contentType?: string,
): Promise<Response> {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  const service = 's3';
  const region = 'us-east-1';

  const payloadHash = sha256Hex(body ?? '');
  const host = `${env.MINIO_ENDPOINT}:${env.MINIO_PORT}`;
  const canonicalUri = `/${encodeS3Path(resourcePath)}`;

  const canonicalHeaders = [
    `host:${host}`,
    `x-amz-content-sha256:${payloadHash}`,
    `x-amz-date:${amzDate}`,
  ];

  if (contentType) {
    canonicalHeaders.push(`content-type:${contentType}`);
  }

  canonicalHeaders.sort();

  const signedHeaders = canonicalHeaders.map((header) => header.split(':')[0]).join(';');

  const canonicalRequest = [
    method,
    canonicalUri,
    '',
    `${canonicalHeaders.join('\n')}\n`,
    signedHeaders,
    payloadHash,
  ].join('\n');

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join('\n');

  const kDate = hmac(`AWS4${env.MINIO_SECRET_KEY}`, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  const kSigning = hmac(kService, 'aws4_request');
  const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');

  const authorization =
    `AWS4-HMAC-SHA256 Credential=${env.MINIO_ACCESS_KEY}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const headers: Record<string, string> = {
    Host: host,
    'x-amz-date': amzDate,
    'x-amz-content-sha256': payloadHash,
    Authorization: authorization,
  };

  if (contentType) {
    headers['Content-Type'] = contentType;
  }

  return fetch(`${getBaseEndpoint()}${canonicalUri}`, {
    method,
    headers,
    body: body ? new Uint8Array(body) : undefined,
  });
}

function validateImage(mimeType: string, size: number): void {
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new AppError('Tipo de imagem inválido. Permitidos: image/jpeg, image/png, image/webp', 400);
  }

  if (size > MAX_IMAGE_SIZE_BYTES) {
    throw new AppError('Imagem excede o tamanho máximo de 5MB', 400);
  }
}

export async function ensureBucketExists(): Promise<void> {
  const bucket = env.MINIO_BUCKET;
  const headResponse = await signedRequest('HEAD', bucket);

  if (headResponse.ok) {
    return;
  }

  if (headResponse.status !== 404) {
    throw new AppError('Falha ao validar bucket no MinIO', 500);
  }

  const createResponse = await signedRequest('PUT', bucket);
  if (!createResponse.ok) {
    throw new AppError('Falha ao criar bucket no MinIO', 500);
  }
}

export async function uploadImage(input: UploadImageInput) {
  validateImage(input.mimeType, input.buffer.length);

  const ext = resolveExtension(input.originalName, input.mimeType);
  const safeName = slugifyFileName(input.originalName);
  const storageKey = `imoveis/${input.imovelId}/${Date.now()}-${safeName}.${ext}`;
  const objectPath = `${env.MINIO_BUCKET}/${storageKey}`;

  const response = await signedRequest('PUT', objectPath, input.buffer, input.mimeType);

  if (!response.ok) {
    throw new AppError('Falha ao realizar upload de imagem no MinIO', 500);
  }

  const encodedKey = storageKey
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');

  return {
    storageKey,
    url: `${env.PUBLIC_BASE_URL}/${env.MINIO_BUCKET}/${encodedKey}`,
    size: input.buffer.length,
    mimeType: input.mimeType,
  };
}

export async function deleteObject(storageKey: string): Promise<void> {
  const response = await signedRequest('DELETE', `${env.MINIO_BUCKET}/${storageKey}`);

  if (!response.ok && response.status !== 404) {
    throw new AppError('Falha ao remover imagem do MinIO', 500);
  }
}

export const imageStorageRules = {
  maxPerImovel: 10,
};
