import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { UserPlanStatus } from '../enums/user-plan-status.enum';
import { BaseEntity } from './base.entity';
import { PlanEntity } from './plan.entity';
import { UserEntity } from './user.entity';

@Entity({ name: 'user_plans' })
@Index('idx_user_plans_user_id', ['userId'])
@Index('idx_user_plans_status', ['status'])
export class UserPlanEntity extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'plan_id', type: 'uuid' })
  planId!: string;

  @Column({ name: 'start_date', type: 'timestamptz' })
  startDate!: Date;

  @Column({ name: 'end_date', type: 'timestamptz', nullable: true })
  endDate!: Date | null;

  @Column({ name: 'remaining_seconds', type: 'integer' })
  remainingSeconds!: number;

  @Column({ name: 'reserved_seconds', type: 'integer' })
  reservedSeconds!: number;

  @Column({ name: 'remaining_storage_bytes', type: 'bigint' })
  remainingStorageBytes!: number;

  @Column({ name: 'reserved_storage_bytes', type: 'bigint' })
  reservedStorageBytes!: number;

  @Column({ name: 'status', type: 'enum', enum: UserPlanStatus })
  status!: UserPlanStatus;

  @ManyToOne(() => UserEntity, (user) => user.userPlans)
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @ManyToOne(() => PlanEntity, (plan) => plan.userPlans)
  @JoinColumn({ name: 'plan_id' })
  plan!: PlanEntity;
}
