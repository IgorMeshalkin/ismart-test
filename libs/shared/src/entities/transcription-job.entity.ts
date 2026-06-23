import { Column, Entity, Index, JoinColumn, OneToOne } from 'typeorm';
import { TranscriptionJobStatus } from '../enums/transcription-job-status.enum';
import { BaseEntity } from './base.entity';
import { FileEntity } from './file.entity';

@Entity({ name: 'transcription_jobs' })
@Index('uq_transcription_jobs_file_id', ['fileId'], { unique: true })
@Index('idx_transcription_jobs_status', ['status'])
export class TranscriptionJobEntity extends BaseEntity {
  @Column({ name: 'file_id', type: 'uuid' })
  fileId!: string;

  @Column({ name: 'status', type: 'enum', enum: TranscriptionJobStatus })
  status!: TranscriptionJobStatus;

  @Column({ name: 'request_topic', type: 'varchar' })
  requestTopic!: string;

  @Column({ name: 'response_topic', type: 'varchar' })
  responseTopic!: string;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage!: string | null;

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt!: Date | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt!: Date | null;

  @OneToOne(() => FileEntity, (file) => file.transcriptionJob)
  @JoinColumn({ name: 'file_id' })
  file!: FileEntity;
}
