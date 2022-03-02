import { Field, ObjectType } from 'type-graphql'
import { BaseEntity, Entity, ManyToOne } from 'typeorm'

import { Post } from './Post'
import { User } from './User'

@ObjectType()
@Entity()
export class Upvote extends BaseEntity {
  // @Field()
  // @PrimaryColumn()
  // userId: number

  // @Field()
  // @PrimaryColumn()
  // postId: number

  @Field(() => User)
  @ManyToOne(() => User, user => user.upvotes, { primary: true })
  user!: User

  @Field(() => Post)
  @ManyToOne(() => Post, post => post.upvotes, { primary: true })
  post!: Post
}
