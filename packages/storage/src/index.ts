import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

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
  if (input.contentLength <= 0 || input.contentLength > MAX_DOCUMENT_BYTES) {
    throw new StorageValidationError(`File size must be between 1 and ${MAX_DOCUMENT_BYTES} bytes.`);
  }
  const ct = input.contentType.toLowerCase();
  const allowed =
    ct === 'application/pdf' ||
    ct === 'image/jpeg' ||
    ct === 'image/png' ||
    ct === 'image/webp';
  if (!allowed) {
    throw new StorageValidationError('Only PDF, JPEG, PNG, or WebP uploads are allowed.');
  }

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
  const safe = fileName.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 120) || 'document';
  return `lawyer-docs/${userId}/${documentId}/${safe}`;
}
