import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class StorageService {
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly internalEndpoint: string;
  private readonly publicEndpoint: string;

  constructor(private readonly config: ConfigService) {
    const explicitEndpoint = config.get<string>('CLOUD_STORAGE_ENDPOINT_URL');
    const accountId = config.get<string>('CLOUD_STORAGE_ACCOUNT_ID');

    if (!explicitEndpoint && !accountId) {
      throw new Error('Either CLOUD_STORAGE_ENDPOINT_URL or CLOUD_STORAGE_ACCOUNT_ID must be set');
    }

    this.internalEndpoint = explicitEndpoint ?? `https://${accountId}.r2.cloudflarestorage.com`;
    this.publicEndpoint = config.get<string>('CLOUD_STORAGE_PUBLIC_URL') ?? this.internalEndpoint;

    const accessKeyId = config.getOrThrow<string>('CLOUD_STORAGE_ACCESS_KEY_ID');
    const secretAccessKey = config.getOrThrow<string>('CLOUD_STORAGE_SECRET_ACCESS_KEY');

    this.bucket = config.getOrThrow<string>('CLOUD_STORAGE_BUCKET_NAME');
    this.s3 = new S3Client({
      region: 'auto',
      endpoint: this.internalEndpoint,
      forcePathStyle: !!explicitEndpoint,
      credentials: { accessKeyId, secretAccessKey },
    });
  }

  async generatePresignedPutUrl(key: string, expiresIn: number): Promise<string> {
    const command = new PutObjectCommand({ Bucket: this.bucket, Key: key });
    const url = await getSignedUrl(this.s3, command, { expiresIn });
    return url.replace(this.internalEndpoint, this.publicEndpoint);
  }
}
