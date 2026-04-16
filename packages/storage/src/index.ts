import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { Readable } from 'node:stream';

const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
const MAX_NOTICE_BYTES = 10 * 1024 * 1024;
/** Single vault ciphertext blob cap (free tier total quota is enforced in API). */
export const MAX_VAULT_OBJECT_BYTES = 10 * 1024 * 1024;

export interface S3DocumentsConfig {
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
}

export class StorageNotConfiguredError extends Error {
  constructor(message = 'Document uploads are not configured (missing AWS S3 environment).') {
    super(message);
    this.name = 'StorageNotConfiguredError';
  }
}

export class StorageValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StorageValidationError';
  }
}

/**
 * Reads S3 credentials and bucket from process env. Returns null if any required value is missing.
 */
export function parseS3DocumentsConfigFromEnv(env: NodeJS.ProcessEnv): S3DocumentsConfig | null {
  const region = env.AWS_REGION?.trim();
  const bucket = env.AWS_S3_BUCKET?.trim();
  const accessKeyId = env.AWS_ACCESS_KEY_ID?.trim();
  const secretAccessKey = env.AWS_SECRET_ACCESS_KEY?.trim();
  if (!region || !bucket || !accessKeyId || !secretAccessKey) return null;
  return { region, bucket, accessKeyId, secretAccessKey };
}

function createClient(config: S3DocumentsConfig): S3Client {
  return new S3Client({
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

export interface PresignPutInput {
  key: string;
  contentType: string;
  contentLength: number;
  expiresSeconds?: number;
}

/**
 * Presigns a PUT URL for a single object. Validates size and basic content type.
 */
export async function presignPutObject(
  config: S3DocumentsConfig,
  input: PresignPutInput,
): Promise<{ url: string }> {
  validateUpload(input.contentType, input.contentLength, MAX_DOCUMENT_BYTES);
  const ct = input.contentType.toLowerCase();
  validateContentType(ct);

  const client = createClient(config);
  const cmd = new PutObjectCommand({
    Bucket: config.bucket,
    Key: input.key,
    ContentType: input.contentType,
    ContentLength: input.contentLength,
  });
  const url = await getSignedUrl(client, cmd, {
    expiresIn: input.expiresSeconds ?? 900,
  });
  return { url };
}

export function lawyerDocumentObjectKey(userId: string, documentId: string, fileName: string): string {
  const safe = safeObjectFileName(fileName);
  return `lawyer-docs/${userId}/${documentId}/${safe}`;
}

export function noticeScanObjectKey(scanId: string, fileName: string): string {
  const safe = safeObjectFileName(fileName);
  return `notice-scans/${scanId}/${safe}`;
}

export function vaultDocumentObjectKey(userId: string, documentId: string): string {
  return `vault/${userId}/${documentId}/blob`;
}

function validateVaultPut(contentType: string, contentLength: number): void {
  const ct = contentType.toLowerCase();
  if (ct !== 'application/octet-stream') {
    throw new StorageValidationError('Vault uploads must use application/octet-stream.');
  }
  if (contentLength <= 0 || contentLength > MAX_VAULT_OBJECT_BYTES) {
    throw new StorageValidationError(
      `Vault file size must be between 1 and ${MAX_VAULT_OBJECT_BYTES} bytes.`,
    );
  }
}

export async function presignPutVaultObject(
  config: S3DocumentsConfig,
  input: PresignPutInput,
): Promise<{ url: string }> {
  validateVaultPut(input.contentType, input.contentLength);
  const client = createClient(config);
  const cmd = new PutObjectCommand({
    Bucket: config.bucket,
    Key: input.key,
    ContentType: input.contentType,
    ContentLength: input.contentLength,
  });
  const url = await getSignedUrl(client, cmd, {
    expiresIn: input.expiresSeconds ?? 900,
  });
  return { url };
}

export async function presignGetVaultObject(
  config: S3DocumentsConfig,
  input: { key: string; expiresSeconds?: number },
): Promise<{ url: string }> {
  const client = createClient(config);
  const cmd = new GetObjectCommand({
    Bucket: config.bucket,
    Key: input.key,
  });
  const url = await getSignedUrl(client, cmd, {
    expiresIn: input.expiresSeconds ?? 900,
  });
  return { url };
}

export async function deleteVaultObject(config: S3DocumentsConfig, key: string): Promise<void> {
  const client = createClient(config);
  await client.send(
    new DeleteObjectCommand({
      Bucket: config.bucket,
      Key: key,
    }),
  );
}

function safeObjectFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 120) || 'document';
}

function validateContentType(contentTypeLower: string): void {
  const allowed =
    contentTypeLower === 'application/pdf' ||
    contentTypeLower === 'image/jpeg' ||
    contentTypeLower === 'image/png' ||
    contentTypeLower === 'image/webp';
  if (!allowed) {
    throw new StorageValidationError('Only PDF, JPEG, PNG, or WebP uploads are allowed.');
  }
}

function validateUpload(contentType: string, contentLength: number, maxBytes: number): void {
  if (contentLength <= 0 || contentLength > maxBytes) {
    throw new StorageValidationError(`File size must be between 1 and ${maxBytes} bytes.`);
  }
  validateContentType(contentType.toLowerCase());
}

export async function presignPutNoticeObject(
  config: S3DocumentsConfig,
  input: PresignPutInput,
): Promise<{ url: string }> {
  validateUpload(input.contentType, input.contentLength, MAX_NOTICE_BYTES);
  const client = createClient(config);
  const cmd = new PutObjectCommand({
    Bucket: config.bucket,
    Key: input.key,
    ContentType: input.contentType,
    ContentLength: input.contentLength,
  });
  const url = await getSignedUrl(client, cmd, {
    expiresIn: input.expiresSeconds ?? 900,
  });
  return { url };
}

export async function fetchObjectBytes(
  config: S3DocumentsConfig,
  key: string,
  maxBytes: number,
): Promise<{ bytes: Uint8Array }> {
  const client = createClient(config);
  const res = await client.send(
    new GetObjectCommand({
      Bucket: config.bucket,
      Key: key,
    }),
  );
  const body = res.Body;
  if (!body) throw new Error('S3 object has no body.');
  const stream = body as Readable;
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of stream) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Uint8Array);
    total += buf.length;
    if (total > maxBytes) {
      throw new StorageValidationError(`File exceeds ${maxBytes} bytes.`);
    }
    chunks.push(buf);
  }
  return { bytes: Buffer.concat(chunks) };
}
