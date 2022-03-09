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
    @Arg('cursor', () => String, { nullable: true }) cursor: string | null,
    @Ctx() { req }: RequestContext
  ): Promise<PaginatedPosts> {
    const realLimit = Math.min(limit, 50)
    const realLimitPlusOne = realLimit + 1

    const replacements: any[] = [realLimitPlusOne]

    const { userId } = req.session
    if (userId) {
      replacements.push(userId)
    }

    let cursorIdx = 3
    if (cursor) {
      replacements.push(new Date(parseInt(cursor)))
      cursorIdx = replacements.length
    }

    const posts = await getConnection().query(
      `
        SELECT p.*,
        json_build_object(
          'id', u.id,
          'username', u.username,
          'email', u.email,
          'createdAt', u."createdAt",
          'updatedAt', u."updatedAt"
          ) AS user,
        ${
          userId
            ? '(SELECT value FROM upvote WHERE "userId" = $2 AND "postId" = p.id) "voteStatus"'
            : 'null as "voteStatus"'
        }
        FROM post p
        INNER JOIN public.user u ON u.id = p."userId"
        ${cursor ? `WHERE p."createdAt" < $${cursorIdx}` : ''}
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
