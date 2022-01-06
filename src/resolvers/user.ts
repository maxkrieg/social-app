import { sendEmail } from './../utils/sendEmail'
import argon2 from 'argon2'
import { Arg, Ctx, Field, Mutation, ObjectType, Query, Resolver } from 'type-graphql'
import config from '../config'
import { User } from './../entities/User'
import { RequestContext } from './../types'
import { validateRegister } from './../utils/validateRegister'
import { EmailPasswordInput } from './EmailPasswordInput'
import { v4 } from 'uuid'
import { FORGOT_PASSWORD_PREFIX } from '../constants'

@ObjectType()
class FieldError {
  @Field()
  field: string

  @Field()
  message: string
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[]

  @Field(() => User, { nullable: true })
  user?: User
}

const unauthorizedErrors: FieldError[] = [
  {
    field: 'email',
    message: 'Incorrect email or password'
  },
  {
    field: 'password',
    message: 'Incorrect email or password'
  }
]

@Resolver()
export class UserResolver {
  @Query(() => User, { nullable: true })
  async currentUser(@Ctx() { req, em }: RequestContext): Promise<User | null> {
    if (!req.session.userId) return null
    const user = await em.findOne(User, { id: req.session.userId })
    return user
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg('options') options: EmailPasswordInput,
    @Ctx() { em, req }: RequestContext
  ): Promise<UserResponse> {
    const { email, password } = options

    const existingUser = await em.findOne(User, { email })

    const errors = validateRegister(options, existingUser)
    if (errors) return { errors }

    const passwordHash = await argon2.hash(password)
    const user = em.create(User, { email, password: passwordHash })
    try {
      await em.persistAndFlush(user)
    } catch (e) {
      // TODO: Better error introspection and response
      return {
        errors: [
          { field: 'email', message: e.message },
          { field: 'password', message: e.message }
        ]
      }
    }

    req.session.userId = user.id

    return { user }
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg('options') options: EmailPasswordInput,
    @Ctx() { em, req }: RequestContext
  ): Promise<UserResponse> {
    const { email, password } = options

    const user = await em.findOne(User, { email })
    if (!user) return { errors: unauthorizedErrors }

    const isCorrectPassword = await argon2.verify(user.password, password)
    if (!isCorrectPassword) return { errors: unauthorizedErrors }

    req.session.userId = user.id

    return { user }
  }

  @Mutation(() => Boolean)
  async logout(@Ctx() { req, res }: RequestContext): Promise<Boolean> {
    return new Promise(resolve =>
      req.session.destroy(err => {
        res.clearCookie(config.session.name)
        if (err) {
          console.error(err)
          resolve(false)
          return
        }
        resolve(true)
      })
    )
  }

  @Mutation(() => Boolean)
  async forgotPassword(
    @Arg('email') email: string,
    @Ctx() { em, redis }: RequestContext
  ): Promise<Boolean> {
    const user = await em.findOne(User, { email })
    if (!user) return true

    const token = v4()

    await redis.set(
      FORGOT_PASSWORD_PREFIX + token,
      user.id,
      'ex',
      1000 * 60 * 60 * 24 * 3 // 3 days
    )

    sendEmail(email, `<a href="http://localhost:3000/change-password/${token}">reset password</a>`)

    return true
  }
}
