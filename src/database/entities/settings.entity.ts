import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';

@Entity('settings')
export class Settings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  key: string;

  @Column({ type: 'text' })
  value: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  updatedBy: string;

  @UpdateDateColumn({ default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @BeforeInsert()
  setUpdatedAtOnInsert() {
    if (!this.updatedAt) {
      this.updatedAt = new Date();
    }
  }

  @BeforeUpdate()
  setUpdatedAtOnUpdate() {
    this.updatedAt = new Date();
  }
}