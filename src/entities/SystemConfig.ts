import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum ConfigType {
  AI_SYSTEM_PROMPT = 'ai_system_prompt',
  AI_SETTINGS = 'ai_settings',
  GENERAL = 'general'
}

@Entity('system_configs')
export class SystemConfig {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'enum',
    enum: ConfigType,
    unique: true
  })
  type!: ConfigType;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}