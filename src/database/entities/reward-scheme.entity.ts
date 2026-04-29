import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('reward_schemes')
export class RewardScheme {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ default: 0 })
  pointsCost: number;

  @Column()
  category: string;

  @Column({ nullable: true })
  storeCategory: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  mrp: number;

  @Column({ default: true })
  active: boolean;

  @Column({ nullable: true })
  targetRole: string;

  @Column({ default: 0 })
  sortOrder: number;

  @Column({ nullable: true })
  legacyCategoryId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
