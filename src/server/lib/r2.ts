import { randomUUID } from 'node:crypto'
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CF_R2_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.CF_R2_SECRET_ACCESS_KEY ?? '',
  },
})

const BUCKET = process.env.CF_R2_BUCKET ?? 'syscohada-coffre'

export function generateR2Key(tenantId: string, exerciceId: string, filename: string): string {
  return `${tenantId}/${exerciceId}/${randomUUID()}-${filename}`
}

export async function getUploadUrl(key: string, contentType: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  })
  return getSignedUrl(s3, command, { expiresIn: 3600 })
}

export async function getDownloadUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  })
  return getSignedUrl(s3, command, { expiresIn: 3600 })
}

export async function deleteFile(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: key,
  })
  await s3.send(command)
}
