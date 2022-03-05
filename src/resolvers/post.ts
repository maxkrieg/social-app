import {
  Arg,
  Ctx,
  Field,
  FieldResolver,
  ID,
  InputType,
  Int,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  Root,
  UseMiddleware
} from 'type-graphql'
import { getConnection } from 'typeorm'

import { User } from '../entities/User'
import { RequestContext } from '../types'
import { Post } from './../entities/Post'
import { Upvote } from './../entities/Upvote'
import { isAuthenticated } from './../middleware/isAuthenticated'

@InputType()
class PostInput {
  @Field()
  title!: string

  @Field()
  text!: string
}

@ObjectType()
class PaginatedPosts {
  @Field(() => [Post])
  posts!: Post[]

  @Field()
  hasMore!: boolean
}

@Resolver(Post)
export class PostResolver {
  @FieldResolver(() => String)
  textSnippet(@Root() root: Post): string {
    if (root.text.length > 50) {
      return root.text.slice(0, 50) + '...'
    }
    return root.text
  }

  @Query(() => PaginatedPosts)
  async posts(
    @Arg('limit', () => Int) limit: number,
    @Arg('cursor', () => String, { nullable: true }) cursor: string | null
  ): Promise<PaginatedPosts> {
    const realLimit = Math.min(limit, 50)
    const realLimitPlusOne = realLimit + 1
    const qb = getConnection()
      .getRepository(Post)
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user')
      .orderBy('post.createdAt', 'DESC')
      .take(realLimitPlusOne)
    if (cursor) {
      qb.where('post.createdAt < :cursor', { cursor: new Date(parseInt(cursor)) })
    }
    const posts = await qb.getMany()
    const hasMore = posts.length === realLimitPlusOne
    return { posts: posts.slice(0, realLimit), hasMore }
  }

  @Query(() => Post, { nullable: true })
  async post(@Arg('id', () => ID) id: string): Promise<Post | null> {
    const post = await Post.findOne(id)
    return post || null
  }

  @Mutation(() => Post, { nullable: true })
  @UseMiddleware(isAuthenticated)
  async createPost(
    @Arg('input') input: PostInput,
    @Ctx() { req }: RequestContext
  ): Promise<Post | null> {
    const user = await User.findOne(req.session.userId)
    return Post.create({ ...input, user }).save()
  }

  @Mutation(() => Post, { nullable: true })
  @UseMiddleware(isAuthenticated)
  async updatePost(
    @Arg('id', () => ID) id: number,
    @Arg('title') title: string
  ): Promise<Post | null> {
    const post = await Post.findOne(id)
    if (!post) return null

    if (title !== 'undefined') {
      await Post.update({ id }, { title })
    }
    return post
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuthenticated)
  async deletePost(@Arg('id', () => ID) id: number): Promise<boolean> {
    await Post.delete(id)
    return true
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuthenticated)
  async vote(
    @Arg('postId', () => ID) postId: number,
    @Arg('value', () => Int) value: number,
    @Ctx() { req }: RequestContext
  ): Promise<Boolean> {
    const { userId } = req.session

    const isUpvote = value !== -1
    const realValue = isUpvote ? 1 : -1

    const existingVote = await Upvote.findOne({ where: { userId, postId } })

    if (existingVote && existingVote.value !== realValue) {
      await getConnection().transaction(async manager => {
        await manager.update(Upvote, { userId, postId }, { value: realValue })
        await manager.update(Post, { id: postId }, { points: () => `points + ${realValue * 2}` })
      })
    } else if (!existingVote) {
      await getConnection().transaction(async manager => {
        await manager.save(Upvote.create({ userId, postId, value: realValue }))
        await manager.update(Post, { id: postId }, { points: () => `points + ${realValue}` })
      })
    }
    return true
  }
}
