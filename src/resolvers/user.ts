import argon2 from 'argon2'
import { RequestContext } from './../types'
import { User } from './../entities/User'
import { Resolver, Ctx, Arg, Mutation, InputType, Field, ObjectType } from 'type-graphql'

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

    // TODO: actual email validation
    if (email.length <= 2) {
      return {
        errors: [{ field: 'email', message: 'Invalid email' }]
      }
    }

    // TODO: password validation

    const passwordHash = await argon2.hash(password)
    const user = em.create(User, { email, password: passwordHash })
    await em.persistAndFlush(user)

    return { user }
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg('options') options: EmailPasswordInput,
    @Ctx() { em }: RequestContext
  ): Promise<UserResponse> {
    const { email, password } = options

    const user = await em.findOne(User, { email })
    if (!user) return { errors: unauthorizedErrors }

    const isCorrectPassword = await argon2.verify(user.password, password)
    if (!isCorrectPassword) return { errors: unauthorizedErrors }

    return { user }
  }
}
