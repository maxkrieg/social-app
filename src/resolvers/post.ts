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

  @FieldResolver(() => User)
  async user(@Root() root: Post, @Ctx() { userLoader }: RequestContext): Promise<User | null> {
    return userLoader.load(root.userId)
  }

  @FieldResolver(() => Upvote)
  async voteStatus(
    @Root() root: Post,
    @Ctx() { upvoteLoader, req }: RequestContext
  ): Promise<number | null> {
    if (!req.session.userId) return null
    const upvotes = await upvoteLoader.load({ postId: root.id, userId: req.session.userId })
    return upvotes ? upvotes.value : null
  }

  @Query(() => PaginatedPosts)
  async posts(
    @Arg('limit', () => Int) limit: number,
    @Arg('cursor', () => String, { nullable: true }) cursor: string | null
  ): Promise<PaginatedPosts> {
    const realLimit = Math.min(limit, 50)
    const realLimitPlusOne = realLimit + 1

    const replacements: any[] = [realLimitPlusOne, ...(cursor ? [new Date(parseInt(cursor))] : [])]
    const posts = await getConnection().query(
      `
        SELECT p.*
        FROM post p
        ${cursor ? 'WHERE p."createdAt" < $2' : ''}
        ORDER BY p."createdAt" DESC
        LIMIT $1
      `,
      replacements
    )
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
    @Arg('title') title: string,
    @Arg('text') text: string,
    @Ctx() { req }: RequestContext
  ): Promise<Post | null> {
    const result = await getConnection()
      .createQueryBuilder()
      .update(Post)
      .set({ title, text })
      .where('id = :postId', { postId: id })
      .andWhere('userId = :userId', { userId: req.session.userId })
      .returning('*')
      .execute()
    return result.raw[0] ? result.raw[0] : null
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuthenticated)
  async deletePost(
    @Arg('id', () => ID) id: number,
    @Ctx() { req }: RequestContext
  ): Promise<boolean> {
    await Post.delete({ id, userId: req.session.userId })
    return true
  }

  @Mutation(() => Int)
  @UseMiddleware(isAuthenticated)
  async vote(
    @Arg('postId', () => ID) postId: number,
    @Arg('value', () => Int) value: number,
    @Ctx() { req }: RequestContext
  ): Promise<number> {
    const { userId } = req.session

    const isUpvote = value !== -1
    const realValue = isUpvote ? 1 : -1

    const existingVote = await Upvote.findOne({ where: { userId, postId } })

    let pointsChange = 0
    if (existingVote && existingVote.value !== realValue) {
      pointsChange = realValue * 2
      await getConnection().transaction(async manager => {
        await manager.update(Upvote, { userId, postId }, { value: realValue })
        await manager.update(Post, { id: postId }, { points: () => `points + ${pointsChange}` })
      })
    } else if (!existingVote) {
      pointsChange = realValue
      await getConnection().transaction(async manager => {
        await manager.save(Upvote.create({ userId, postId, value: realValue }))
        await manager.update(Post, { id: postId }, { points: () => `points + ${pointsChange}` })
      })
    }
    return pointsChange
  }
}
