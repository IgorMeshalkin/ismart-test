import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { KnowledgeBaseFileEntity } from './knowledge-base-file.entity';
import { KnowledgeBaseSubscriberEntity } from './knowledge-base-subscriber.entity';
import { UserEntity } from './user.entity';

@Entity({ name: 'knowledge_bases' })
@Index('idx_knowledge_bases_owner_id', ['ownerId'])
export class KnowledgeBaseEntity extends BaseEntity {
  @Column({ name: 'name', type: 'varchar' })
  name!: string;

  @Column({ name: 'description', type: 'text' })
  description!: string;

  @Column({ name: 'owner_id', type: 'uuid' })
  ownerId!: string;

  @Column({ name: 'is_public', type: 'boolean', default: false })
  isPublic!: boolean;

  @ManyToOne(() => UserEntity, (user) => user.knowledgeBases)
  @JoinColumn({ name: 'owner_id' })
  owner!: UserEntity;

  @OneToMany(() => KnowledgeBaseFileEntity, (knowledgeBaseFile) => knowledgeBaseFile.knowledgeBase)
  knowledgeBaseFiles!: KnowledgeBaseFileEntity[];

  @OneToMany(() => KnowledgeBaseSubscriberEntity, (subscriber) => subscriber.knowledgeBase)
  subscribers!: KnowledgeBaseSubscriberEntity[];
}
