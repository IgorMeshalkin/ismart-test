import { Column, Entity, Index, OneToMany } from 'typeorm';
import { UserRole } from '../enums/user-role.enum';
import { BaseEntity } from './base.entity';
import { FileEntity } from './file.entity';
import { KnowledgeBaseSubscriberEntity } from './knowledge-base-subscriber.entity';
import { KnowledgeBaseEntity } from './knowledge-base.entity';
import { NotificationEntity } from './notification.entity';
import { UserPlanEntity } from './user-plan.entity';

@Entity({ name: 'users' })
@Index('idx_users_role', ['role'])
@Index('uq_users_email', ['email'], { unique: true })
export class UserEntity extends BaseEntity {
  @Column({ name: 'first_name', type: 'varchar' })
  firstName!: string;

  @Column({ name: 'last_name', type: 'varchar' })
  lastName!: string;

  @Column({ name: 'email', type: 'varchar' })
  email!: string;

  @Column({ name: 'password_hash', type: 'varchar' })
  passwordHash!: string;

  @Column({ name: 'role', type: 'enum', enum: UserRole })
  role!: UserRole;

  @OneToMany(() => UserPlanEntity, (userPlan) => userPlan.user)
  userPlans!: UserPlanEntity[];

  @OneToMany(() => FileEntity, (file) => file.author)
  files!: FileEntity[];

  @OneToMany(() => KnowledgeBaseEntity, (knowledgeBase) => knowledgeBase.owner)
  knowledgeBases!: KnowledgeBaseEntity[];

  @OneToMany(() => KnowledgeBaseSubscriberEntity, (subscriber) => subscriber.user)
  knowledgeBaseSubscribers!: KnowledgeBaseSubscriberEntity[];

  @OneToMany(() => NotificationEntity, (notification) => notification.user)
  notifications!: NotificationEntity[];
}
