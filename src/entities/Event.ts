import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  // ManyToOne,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm'
import { Field, ID, ObjectType } from 'type-graphql'
import { User } from './User'
import { EventUser } from './EventUser'

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

  @Field()
  @Column()
  dateTime: Date

  @Field()
  @CreateDateColumn()
  createdAt: Date

  @Field()
  @UpdateDateColumn()
  updatedAt: Date

  // @Field()
  // userId!: number

  // @Field(() => User)
  // @ManyToOne(() => User, user => user.events, { onDelete: 'CASCADE' })
  // user!: User

  @Field(() => [EventUser])
  @OneToMany(() => EventUser, eventUser => eventUser.event)
  eventUsers: EventUser[]

  @ManyToMany(() => User, user => user.events)
  users: User[]
}
