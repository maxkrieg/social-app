import argon2 from 'argon2'
import { Resolver, Ctx, Arg, Mutation, InputType, Field, ObjectType, Query } from 'type-graphql'
import { RequestContext } from './../types'
import { User } from './../entities/User'
import { validateEmail } from '../utils'

@InputType()
class EmailPasswordInput {
  @Field()
  email!: string

  @Field()
  password!: string
}

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
    @Ctx() { em }: RequestContext
  ): Promise<UserResponse> {
    const { email, password } = options

    const existingUser = await em.findOne(User, { email })
    if (existingUser) {
      return {
        errors: [
          {
            field: 'email',
            message: 'That email is already registered'
          }
        ]
      }
    }

    if (!validateEmail(email)) {
      return {
        errors: [{ field: 'email', message: 'Invalid email' }]
      }
    }

    // TODO: Stronger password complexity validation
    if (password.length <= 2) {
      return {
        errors: [{ field: 'password', message: 'Invalid password' }]
      }
    }

    const passwordHash = await argon2.hash(password)
    const user = em.create(User, { email, password: passwordHash })
    await em.persistAndFlush(user)

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
}
