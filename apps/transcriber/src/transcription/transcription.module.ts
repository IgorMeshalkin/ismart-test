import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module';
import { TranscriptionConsumer } from './transcription.consumer';

@Module({
  imports: [StorageModule],
  controllers: [TranscriptionConsumer],
})
export class TranscriptionModule {}
