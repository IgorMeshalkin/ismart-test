import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import * as path from 'path';
import { TranscriptionJobMessageDto } from '@dto';
import { StorageService } from '../storage/storage.service';

@Controller()
export class TranscriptionConsumer {
  private readonly logger = new Logger(TranscriptionConsumer.name);

  constructor(private readonly storageService: StorageService) {}

  @EventPattern('transcription.jobs')
  async handleTranscriptionJob(@Payload() message: TranscriptionJobMessageDto): Promise<void> {
    const { jobId, fileId, audioStorageKey } = message;
    this.logger.log(`Received job: jobId=${jobId} fileId=${fileId}`);

    const destPath = path.join(process.cwd(), `${fileId}.webm`);
    await this.storageService.downloadFile(audioStorageKey, destPath);
  }
}
