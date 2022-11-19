import {
  Arg,
  Ctx,
  Field,
  Query,
  ID,
  InputType,
  Mutation,
  Resolver,
  UseMiddleware
  // FieldResolver,
  // Root
} from 'type-graphql'
import { getConnection } from 'typeorm'
import { EventUser, EventUserRole } from '../entities/EventUser'

import { User } from '../entities/User'
import { RequestContext } from '../types'
import { Event } from './../entities/Event'
import { isAuthenticated } from './../middleware/isAuthenticated'

@InputType()
class EventInput {
  @Field()
  title!: string

  @Field()
  description!: string

  @Field()
  location!: string

  @Field()
  dateTime: Date
}

// @ObjectType()
// class PaginatedPosts {
//   @Field(() => [Post])
//   posts!: Post[]

//   @Field()
//   hasMore!: boolean
// }

@Resolver(Event)
export class EventResolver {
  // @FieldResolver(() => User)
  // async user(@Root() root: Event, @Ctx() { userLoader }: RequestContext): Promise<User | null> {
  //   return userLoader.load(root.userId)
  // }

  // @Query(() => PaginatedPosts)
  // async posts(
  //   @Arg('limit', () => Int) limit: number,
  //   @Arg('cursor', () => String, { nullable: true }) cursor: string | null
  // ): Promise<PaginatedPosts> {
  //   const realLimit = Math.min(limit, 50)
  //   const realLimitPlusOne = realLimit + 1

  //   const replacements: any[] = [realLimitPlusOne, ...(cursor ? [new Date(parseInt(cursor))] : [])]
  //   const posts = await getConnection().query(
  //     `
  //       SELECT p.*
  //       FROM post p
  //       ${cursor ? 'WHERE p."createdAt" < $2' : ''}
  //       ORDER BY p."createdAt" DESC
  //       LIMIT $1
  //     `,
  //     replacements
  //   )
  //   const hasMore = posts.length === realLimitPlusOne
  //   return { posts: posts.slice(0, realLimit), hasMore }
  // }

  @Query(() => Event, { nullable: true })
  async event(
    @Arg('id', () => ID) id: string,
    @Ctx() { req }: RequestContext
  ): Promise<Event | null> {
    console.log('================= event resolver ====================')
    console.log('user id', req.session.userId)
    console.log('event id', id)
    // const event = await Event.findOne(id)

    // const result = await getConnection()
    //   .getRepository(Event)
    //   .createQueryBuilder('event')
    //   .leftJoin('event_user', 'eu', 'eu.eventId = event.id')
    //   .leftJoinAndSelect('user', 'u', 'u.id = eu.userId')
    //   .where('event.id = :id', { id })
    //   .getOne()
    console.log(req)

    console.log('---------------------------------------------')
    const result = await getConnection()
      .getRepository(Event)
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.eventUsers', 'event_user')
      .leftJoinAndSelect('event_user.user', 'user')
      .leftJoinAndSelect('event_user.event', 'event2')
      .where('event.id = :id', { id })
      .getOne()
    console.log('---------------------------------------------')

    console.log(result)
    console.log(result?.eventUsers)

    return result || null
  }

  @Mutation(() => Event, { nullable: true })
  @UseMiddleware(isAuthenticated)
  async createEvent(
    @Arg('input') input: EventInput,
    @Ctx() { req }: RequestContext
  ): Promise<Event | null> {
    const user = await User.findOne(req.session.userId)
    if (!user) return null
    let event
    await getConnection().transaction(async manager => {
      const eventInsertResult = await manager
        .createQueryBuilder()
        .insert()
        .into(Event)
        .values(input)
        .returning('*')
        .execute()
      event = eventInsertResult.raw[0]
      await manager
        .createQueryBuilder()
        .insert()
        .into(EventUser)
        .values({ eventId: event.id, userId: user.id, role: EventUserRole.HOST })
        .execute()
    })
    console.log('EVENT', event)
    return event || null
  }

  @Mutation(() => Event, { nullable: true })
  @UseMiddleware(isAuthenticated)
  async updateEvent(
    @Arg('id', () => ID) id: number,
    @Arg('title') title: string,
    @Arg('description') description: string,
    @Arg('location') location: string,
    @Ctx() { req }: RequestContext
  ): Promise<Event | null> {
    const result = await getConnection()
      .createQueryBuilder()
      .update(Event)
      .set({ title, description, location })
      .where('id = :eventId', { eventId: id })
      .andWhere('userId = :userId', { userId: req.session.userId })
      .returning('*')
      .execute()
    return result.raw[0] ? result.raw[0] : null
  }

  // @Mutation(() => Boolean)
  // @UseMiddleware(isAuthenticated)
  // async deleteEvent(
  //   @Arg('id', () => ID) id: number,
  //   @Ctx() { req }: RequestContext
  // ): Promise<boolean> {
  //   await Event.delete({ id, userId: req.session.userId })
  //   return true
  // }
}
