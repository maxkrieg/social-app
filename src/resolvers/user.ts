import argon2 from 'argon2'
import {
  Arg,
  Ctx,
  Field,
  FieldResolver,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  Root
} from 'type-graphql'
import { v4 } from 'uuid'
import config from '../config'
import { FORGOT_PASSWORD_PREFIX } from './../constants'
import { User } from './../entities/User'
import { RequestContext } from './../types'
import { sendEmail } from './../utils/sendEmail'
import { validatePassword } from './../utils/validatePassword'
import { validateRegister } from './../utils/validateRegister'
import { LoginInput } from './LoginInput'
import { RegisterInput } from './RegisterInput'

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

const loginUnauthenticatedErrors: FieldError[] = [
  {
    field: 'email',
    message: 'Incorrect email or password'
  },
  {
    field: 'password',
    message: 'Incorrect email or password'
  }
]

@Resolver(User)
export class UserResolver {
  @FieldResolver(() => String)
  email(@Root() user: User, @Ctx() { req }: RequestContext): string {
    if (req.session.userId === user.id) {
      return user.email
    }
    return ''
  }

  @Query(() => User, { nullable: true })
  async currentUser(@Ctx() { req }: RequestContext): Promise<User | null> {
    const user = await User.findOne({ id: req.session.userId })
    return user || null
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg('options') options: RegisterInput,
    @Ctx() { req }: RequestContext
  ): Promise<UserResponse> {
    const { email, username, password } = options

    const existingUser = await User.findOne({ where: { email } })

    const errors = validateRegister(options, existingUser)
    if (errors) return { errors }

    const passwordHash = await argon2.hash(password)

    let user
    try {
      user = await User.create({ email, username, password: passwordHash }).save()
    } catch (error) {
      console.error('ERROR', error)
      return {
        errors: ['email', 'username', 'password'].map(field => ({
          field,
          message: error.message
        }))
      }
    }

    req.session.userId = user.id

    return { user }
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg('options') options: LoginInput,
    @Ctx() { req }: RequestContext
  ): Promise<UserResponse> {
    const { email, password } = options

    const user = await User.findOne({ where: { email } })
    if (!user) return { errors: loginUnauthenticatedErrors }

    const isCorrectPassword = await argon2.verify(user.password, password)
    if (!isCorrectPassword) return { errors: loginUnauthenticatedErrors }

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
    @Ctx() { redis }: RequestContext
  ): Promise<Boolean> {
    const user = await User.findOne({ where: { email } })
    if (!user) return true

    const token = v4()

    await redis.set(
      FORGOT_PASSWORD_PREFIX + token,
      user.id,
      'ex',
      1000 * 60 * 60 * 24 * 3 // 3 days
    )

    await sendEmail(
      email,
      `<a href="http://${process.env.CORS_ORIGIN}/change-password/${token}">reset password</a>`
    )

    return true
  }

  @Mutation(() => UserResponse)
  async changePassword(
    @Arg('token') token: string,
    @Arg('newPassword') newPassword: string,
    @Ctx() { redis, req }: RequestContext
  ): Promise<UserResponse> {
    const passwordErrors = validatePassword(newPassword, 'newPassword')
    if (passwordErrors) return { errors: passwordErrors }

    const cacheKey = FORGOT_PASSWORD_PREFIX + token
    const userId = await redis.get(cacheKey)
    if (!userId) return { errors: [{ field: 'token', message: 'expired token' }] }

    const userIdNum = parseInt(userId)
    const user = await User.findOne(userIdNum)
    if (!user) return { errors: [{ field: 'token', message: 'user no longer exists' }] }

    const passwordHash = await argon2.hash(newPassword)
    user.password = passwordHash

    try {
      await User.update({ id: userIdNum }, { password: passwordHash })
    } catch (e) {
      // TODO: Better error introspection and response
      return { errors: [{ field: 'newPassword', message: 'server error saving password' }] }
    }

    redis.del(cacheKey)

    req.session.userId = user.id

    return { user }
  }
}
