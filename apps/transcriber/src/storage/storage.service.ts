import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import * as fs from 'fs';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3: S3Client;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    const explicitEndpoint = config.get<string>('CLOUD_STORAGE_ENDPOINT_URL');
    const accountId = config.get<string>('CLOUD_STORAGE_ACCOUNT_ID');

    if (!explicitEndpoint && !accountId) {
      throw new Error('Either CLOUD_STORAGE_ENDPOINT_URL or CLOUD_STORAGE_ACCOUNT_ID must be set');
    }

    const endpoint = explicitEndpoint ?? `https://${accountId}.r2.cloudflarestorage.com`;
    const accessKeyId = config.getOrThrow<string>('CLOUD_STORAGE_ACCESS_KEY_ID');
    const secretAccessKey = config.getOrThrow<string>('CLOUD_STORAGE_SECRET_ACCESS_KEY');

    this.bucket = config.getOrThrow<string>('CLOUD_STORAGE_BUCKET_NAME');
    this.s3 = new S3Client({
      region: 'auto',
      endpoint,
      forcePathStyle: !!explicitEndpoint,
      credentials: { accessKeyId, secretAccessKey },
    });
  }

  async downloadFile(audioStorageKey: string, destPath: string): Promise<void> {
    const response = await this.s3.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: audioStorageKey }),
    );

    const body = response.Body as Readable;
    await fs.promises.writeFile(destPath, body);
    this.logger.log(`File saved: ${destPath}`);
  }
}
