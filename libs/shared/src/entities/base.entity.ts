import {
  Column,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type guid = string;

export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: guid;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_date', type: 'timestamptz' })
  createdDate!: Date;

  @UpdateDateColumn({ name: 'updated_date', type: 'timestamptz' })
  updatedDate!: Date;
}
