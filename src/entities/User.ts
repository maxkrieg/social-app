import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  JoinTable
} from 'typeorm'
import { Field, ID, ObjectType } from 'type-graphql'
import { Post } from './Post'
import { Upvote } from './Upvote'
import { Event } from './Event'
import { EventUser } from './EventUser'

@ObjectType()
@Entity()
export class User extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id!: number

  @Field()
  @Column({ unique: true })
  email!: string

  @Field()
  @Column({ unique: true })
  username!: string

  @Column()
  password!: string

  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date

  @Field(() => [Post])
  @OneToMany(() => Post, post => post.user)
  posts: Post[]

  // @Field(() => [Event])
  // @OneToMany(() => Event, event => event.user)
  // events: Event[]

  @OneToMany(() => Upvote, upvote => upvote.user)
  upvotes: Upvote[]

  @OneToMany(() => EventUser, eventUser => eventUser.user)
  eventUsers: EventUser[]

  @ManyToMany(() => Event, event => event.users)
  @JoinTable({ name: 'event_user' })
  events: Event[]
}
