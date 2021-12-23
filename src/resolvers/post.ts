import { RequestContext } from './../types'
import { Post } from './../entities/Post'
import { Resolver, Query, Ctx, Arg, ID, Mutation } from 'type-graphql'

@Resolver()
export class PostResolver {
  @Query(() => [Post])
  async posts(@Ctx() { em }: RequestContext): Promise<Post[]> {
    return em.find(Post, {})
  }

  @Query(() => Post, { nullable: true })
  async post(@Arg('id', () => ID) id: string, @Ctx() { em }: RequestContext): Promise<Post | null> {
    return em.findOne(Post, { id: parseInt(id) })
  }

  @Mutation(() => Post)
  async createPost(@Arg('title') title: string, @Ctx() { em }: RequestContext): Promise<Post> {
    const post = em.create(Post, { title })
    await em.persistAndFlush(post)
    return post
  }

  @Mutation(() => Post, { nullable: true })
  async updatePost(
    @Arg('id', () => ID) id: string,
    @Arg('title') title: string,
    @Ctx() { em }: RequestContext
  ): Promise<Post | null> {
    const post = await em.findOne(Post, { id: parseInt(id) })
    if (!post) return null

    post.title = title
    await em.persistAndFlush(post)
    return post
  }

  @Mutation(() => Boolean)
  async deletePost(
    @Arg('id', () => ID) id: string,
    @Ctx() { em }: RequestContext
  ): Promise<boolean> {
    try {
      await em.nativeDelete(Post, { id: parseInt(id) })
    } catch (e) {
      console.error(e)
      return false
    }
    return true
  }
}
