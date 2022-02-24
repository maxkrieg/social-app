import {
  Arg,
  Ctx,
  Field,
  FieldResolver,
  ID,
  InputType,
  Int,
  Mutation,
  Query,
  Resolver,
  Root,
  UseMiddleware
} from 'type-graphql'
import { getConnection } from 'typeorm'

import { User } from '../entities/User'
import { RequestContext } from '../types'
import { Post } from './../entities/Post'
import { isAuthenticated } from './../middleware/isAuthenticated'

@InputType()
class PostInput {
  @Field()
  title!: string

  @Field()
  text!: string
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

  @Query(() => [Post])
  async posts(
    @Arg('limit', () => Int) limit: number,
    @Arg('cursor', () => String, { nullable: true }) cursor: string | null
  ): Promise<Post[]> {
    const realLimit = Math.min(limit, 50)
    const qb = getConnection()
      .getRepository(Post)
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user')
      .orderBy('post.createdAt', 'DESC')
      .take(realLimit)
    if (cursor) {
      qb.where('post.createdAt < :cursor', { cursor: new Date(parseInt(cursor)) })
    }
    return qb.getMany()
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
}
