import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { NotificationReason } from '../enums/notification-reason.enum';
import { NotificationType } from '../enums/notification-type.enum';
import { BaseEntity } from './base.entity';
import { UserEntity } from './user.entity';

@Entity({ name: 'notifications' })
@Index('idx_notifications_user_id', ['userId'])
@Index('idx_notifications_is_read', ['isRead'])
export class NotificationEntity extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'type', type: 'enum', enum: NotificationType })
  type!: NotificationType;

  @Column({ name: 'reason', type: 'enum', enum: NotificationReason })
  reason!: NotificationReason;

  @Column({ name: 'payload', type: 'jsonb', default: {} })
  payload!: Record<string, unknown>;

  @Column({ name: 'is_read', type: 'boolean', default: false })
  isRead!: boolean;

  @ManyToOne(() => UserEntity, (user) => user.notifications)
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;
}
