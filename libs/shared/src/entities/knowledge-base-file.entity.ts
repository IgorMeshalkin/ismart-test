import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from './base.entity';
import { FileEntity } from './file.entity';
import { KnowledgeBaseEntity } from './knowledge-base.entity';

@Entity({ name: 'knowledge_base_files' })
@Unique('uq_knowledge_base_files_knowledge_base_id_file_id', ['knowledgeBaseId', 'fileId'])
@Index('idx_knowledge_base_files_knowledge_base_id', ['knowledgeBaseId'])
@Index('idx_knowledge_base_files_file_id', ['fileId'])
export class KnowledgeBaseFileEntity extends BaseEntity {
  @Column({ name: 'knowledge_base_id', type: 'uuid' })
  knowledgeBaseId!: string;

  @Column({ name: 'file_id', type: 'uuid' })
  fileId!: string;

  @Column({ name: 'added_at', type: 'timestamptz' })
  addedAt!: Date;

  @ManyToOne(() => KnowledgeBaseEntity, (knowledgeBase) => knowledgeBase.knowledgeBaseFiles)
  @JoinColumn({ name: 'knowledge_base_id' })
  knowledgeBase!: KnowledgeBaseEntity;

  @ManyToOne(() => FileEntity, (file) => file.knowledgeBaseFiles)
  @JoinColumn({ name: 'file_id' })
  file!: FileEntity;
}
