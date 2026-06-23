import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { KnowledgeBaseRole } from '../enums/knowledge-base-role.enum';
import { BaseEntity } from './base.entity';
import { KnowledgeBaseEntity } from './knowledge-base.entity';
import { UserEntity } from './user.entity';

@Entity({ name: 'knowledge_base_subscribers' })
@Unique('uq_knowledge_base_subscribers_knowledge_base_id_user_id', ['knowledgeBaseId', 'userId'])
@Index('idx_knowledge_base_subscribers_knowledge_base_id', ['knowledgeBaseId'])
@Index('idx_knowledge_base_subscribers_user_id', ['userId'])
export class KnowledgeBaseSubscriberEntity extends BaseEntity {
  @Column({ name: 'knowledge_base_id', type: 'uuid' })
  knowledgeBaseId!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'role', type: 'enum', enum: KnowledgeBaseRole })
  role!: KnowledgeBaseRole;

  @ManyToOne(() => KnowledgeBaseEntity, (knowledgeBase) => knowledgeBase.subscribers)
  @JoinColumn({ name: 'knowledge_base_id' })
  knowledgeBase!: KnowledgeBaseEntity;

  @ManyToOne(() => UserEntity, (user) => user.knowledgeBaseSubscribers)
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;
}
