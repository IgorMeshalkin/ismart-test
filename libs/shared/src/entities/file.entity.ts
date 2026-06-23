import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, OneToOne } from 'typeorm';
import { FileStatus } from '../enums/file-status.enum';
import { BaseEntity } from './base.entity';
import { KnowledgeBaseFileEntity } from './knowledge-base-file.entity';
import { TranscriptionJobEntity } from './transcription-job.entity';
import { UserEntity } from './user.entity';

@Entity({ name: 'files' })
@Index('idx_files_author_id', ['authorId'])
@Index('idx_files_status', ['status'])
export class FileEntity extends BaseEntity {
  @Column({ name: 'original_name', type: 'varchar' })
  originalName!: string;

  @Column({ name: 'duration_seconds', type: 'integer' })
  durationSeconds!: number;

  @Column({ name: 'size_bytes', type: 'bigint' })
  sizeBytes!: number;

  @Column({ name: 'status', type: 'enum', enum: FileStatus })
  status!: FileStatus;

  @Column({ name: 'author_id', type: 'uuid' })
  authorId!: string;

  get audioStorageKey(): string {
    return `audio-${this.id}`;
  }

  get textStorageKey(): string {
    return `text-${this.id}`;
  }

  @ManyToOne(() => UserEntity, (user) => user.files)
  @JoinColumn({ name: 'author_id' })
  author!: UserEntity;

  @OneToMany(() => KnowledgeBaseFileEntity, (knowledgeBaseFile) => knowledgeBaseFile.file)
  knowledgeBaseFiles!: KnowledgeBaseFileEntity[];

  @OneToOne(() => TranscriptionJobEntity, (transcriptionJob) => transcriptionJob.file)
  transcriptionJob!: TranscriptionJobEntity;
}
