import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('festivals')
export class Festival {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column()
  greeting: string;

  @Column({ nullable: true })
  subGreeting: string;

  @Column({ default: '🎉' })
  emoji: string;

  @Column({ default: '🎉✨🎊' })
  bannerEmojis: string;

  @Column({ default: '✨⭐🌟' })
  particleEmojis: string;

  @Column({ default: '#DE3B30' })
  primaryColor: string;

  @Column({ default: '#F59E0B' })
  secondaryColor: string;

  @Column({ default: '#FFFFFF' })
  accentColor: string;

  @Column({ default: '#FFF8E7' })
  bgColor: string;

  @Column({ default: '#FFFBF0' })
  cardColor: string;

  @Column({ default: '#1C0A00' })
  textColor: string;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
