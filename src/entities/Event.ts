import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  // ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm'
import { Field, ID, ObjectType } from 'type-graphql'
// import { User } from './User'
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

  @Field(() => String)
  @Column()
  dateTime: Date

  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date

  // @Field()
  // @Column({ nullable: true })
  // userId!: number

  // @Field(() => User)
  // @ManyToOne(() => User, user => user.events, { onDelete: 'CASCADE' })
  // user!: User

  @OneToMany(() => EventUser, eventUser => eventUser.user)
  eventUsers: EventUser[]
}
