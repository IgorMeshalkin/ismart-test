
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FileEntity, TranscriptionJobEntity } from '@entities';
import { FileStatus, TranscriptionJobStatus } from '@shared';
import {
  ConfirmUploadResponseDto,
  CreateFileDto,
  CreateFileResponseDto,
  TranscriptionJobMessageDto,
} from '@dto';
import { StorageService } from '../storage/storage.service';
import { KafkaProducerService } from '../kafka/kafka-producer.service';

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(FileEntity)
    private readonly fileRepo: Repository<FileEntity>,
    @InjectRepository(TranscriptionJobEntity)
    private readonly jobRepo: Repository<TranscriptionJobEntity>,
    private readonly storageService: StorageService,
    private readonly kafkaProducer: KafkaProducerService,
  ) {}

  async createFile(dto: CreateFileDto, userId: string): Promise<CreateFileResponseDto> {
    const file = this.fileRepo.create({
      originalName: dto.originalName,
      durationSeconds: dto.durationSeconds,
      sizeBytes: dto.sizeBytes,
      status: FileStatus.UPLOADING,
      authorId: userId,
    });
    await this.fileRepo.save(file);

    const uploadUrl = await this.storageService.generatePresignedPutUrl(file.audioStorageKey, 900);
    return { fileId: file.id, uploadUrl };
  }

  async confirmUpload(fileId: string, userId: string): Promise<ConfirmUploadResponseDto> {
    const file = await this.fileRepo.findOneBy({ id: fileId });
    if (!file) throw new NotFoundException('File not found');
    if (file.authorId !== userId) throw new ForbiddenException('Not the file owner');
    if (file.status !== FileStatus.UPLOADING) {
      throw new ConflictException('File is not in UPLOADING status');
    }

    file.status = FileStatus.TRANSCRIBING;
    await this.fileRepo.save(file);

    const job = this.jobRepo.create({
      fileId: file.id,
      status: TranscriptionJobStatus.PENDING,
      requestTopic: 'transcription.jobs',
      responseTopic: 'transcription.results',
      errorMessage: null,
      startedAt: null,
      completedAt: null,
    });
    await this.jobRepo.save(job);

    const message: TranscriptionJobMessageDto = {
      jobId: job.id,
      fileId: file.id,
      authorId: file.authorId,
      originalName: file.originalName,
      durationSeconds: file.durationSeconds,
      sizeBytes: Number(file.sizeBytes),
      audioStorageKey: file.audioStorageKey,
      textStorageKey: file.textStorageKey,
    };
    await this.kafkaProducer.publish('transcription.jobs', file.id, message);

    return { fileId: file.id, status: 'TRANSCRIBING' };
  }
}
