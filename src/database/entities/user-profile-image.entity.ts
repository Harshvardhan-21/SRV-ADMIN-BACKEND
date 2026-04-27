import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { UserRole } from '../../common/enums';

@Entity('user_profile_images')
@Index(['userId', 'userRole'])
export class UserProfileImage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({
    type: 'enum',
    enum: UserRole,
  })
  userRole: UserRole;

  @Column({ type: 'text' })
  imageData: string;

  @Column()
  mimeType: string;

  @Column({ default: true })
  isCurrent: boolean;

  @Column({ nullable: true })
  source: string;

  @CreateDateColumn()
  createdAt: Date;
}
