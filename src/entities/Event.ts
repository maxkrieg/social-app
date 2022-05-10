import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm'
import { Field, ID, ObjectType } from 'type-graphql'
import { User } from './User'

@ObjectType()
@Entity()
export class Event extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id!: number

  @Field()
  @Column()
  title!: string

  @Field()
  @Column()
  location!: string

  @Field()
  @Column()
  description: string

  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date

  @Field()
  @Column()
  userId!: number

  @Field(() => User)
  @ManyToOne(() => User, user => user.events, { onDelete: 'CASCADE' })
  user!: User
}
