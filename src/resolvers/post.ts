import { RequestContext } from './../types'
import { Post } from './../entities/Post'
import { Resolver, Query, Ctx, Arg, ID, Mutation } from 'type-graphql'

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

  @Mutation(() => Post)
  async createPost(@Arg('title') title: string): Promise<Post> {
    return Post.create({ title }).save()
  }

  @Mutation(() => Post, { nullable: true })
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
  async deletePost(@Arg('id', () => ID) id: number): Promise<boolean> {
    await Post.delete(id)
    return true
  }
}
