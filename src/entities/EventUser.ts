import { Field, ObjectType } from 'type-graphql'
import { BaseEntity, Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm'

import { Event } from './Event'
import { User } from './User'

export enum EventUserRole {
  HOST = 'host',
  GUEST = 'guest'
}

@ObjectType()
@Entity()
export class EventUser extends BaseEntity {
  // @Field()
  @PrimaryColumn()
  userId: number

  // @Field()
  @PrimaryColumn()
  eventId: number

  @Field()
  @Column({
    type: 'enum',
    enum: EventUserRole,
    default: EventUserRole.GUEST
  })
  role!: EventUserRole

  @Field(() => User)
  @ManyToOne(() => User, user => user.events, { onDelete: 'CASCADE' })
  user!: User

  @Field(() => Event)
  @ManyToOne(() => Event, event => event.users, { onDelete: 'CASCADE' })
  event!: Event
}
