import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('otp_codes')
@Index(['phone', 'purpose'])
export class OtpCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  phone: string;

  @Column()
  purpose: string;

  @Column()
  code: string;

  @Column({ default: false })
  verified: boolean;

  @Column()
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
