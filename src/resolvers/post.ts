import { isAuthenticated } from './../middleware/isAuthenticated'
import { Post } from './../entities/Post'
import {
  Resolver,
  Query,
  Arg,
  ID,
  Mutation,
  InputType,
  Field,
  Ctx,
  UseMiddleware
} from 'type-graphql'
import { RequestContext } from '../types'
import { User } from '../entities/User'

@InputType()
class PostInput {
  @Field()
  title!: string

  @Field()
  text!: string
}

@Resolver()
export class PostResolver {
  @Query(() => [Post])
  async posts(): Promise<Post[]> {
    return Post.find()
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
