import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { UserPlanEntity } from './user-plan.entity';

@Entity({ name: 'plans' })
export class PlanEntity extends BaseEntity {
  @Column({ name: 'name', type: 'varchar' })
  name!: string;

  @Column({ name: 'description', type: 'text' })
  description!: string;

  @Column({ name: 'price', type: 'decimal', precision: 12, scale: 2 })
  price!: number;

  @Column({ name: 'audio_limit_seconds', type: 'integer' })
  audioLimitSeconds!: number;

  @Column({ name: 'storage_limit_bytes', type: 'bigint' })
  storageLimitBytes!: number;

  @OneToMany(() => UserPlanEntity, (userPlan) => userPlan.plan)
  userPlans!: UserPlanEntity[];
}
