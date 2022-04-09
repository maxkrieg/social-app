import 'reflect-metadata'
import 'dotenv-safe/config'

import { ApolloServerPluginLandingPageGraphQLPlayground } from 'apollo-server-core'
import { ApolloServer } from 'apollo-server-express'
import connectRedis from 'connect-redis'
import cors from 'cors'
import express from 'express'
import session from 'express-session'
import Redis from 'ioredis'
import path from 'path'
import { buildSchema } from 'type-graphql'
import { createConnection } from 'typeorm'

// import config from './config'
import { __prod__, COOKIE_NAME } from './constants'
import { Post } from './entities/Post'
import { Upvote } from './entities/Upvote'
import { User } from './entities/User'
import { HelloResolver } from './resolvers/hello'
import { PostResolver } from './resolvers/post'
import { UserResolver } from './resolvers/user'
import { RequestContext } from './types'
import { createUserLoader } from './utils/createUserLoader'
import { createUpvoteLoader } from './utils/createUpvoteLoader'

const main = async () => {
  const conn = await createConnection({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    logging: true,
    migrations: [path.join(__dirname, './migrations/*')],
    synchronize: !__prod__,
    entities: [User, Post, Upvote]
  })
  await conn.runMigrations()

  const app = express()

  const RedisStore = connectRedis(session)
  const redis = new Redis(process.env.REDIS_URL)
  app.set('proxy', 1)
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN,
      credentials: true
    })
  )
  app.use(
    session({
      name: COOKIE_NAME,
      store: new RedisStore({
        client: redis,
        disableTouch: true
      }),
      saveUninitialized: false,
      secret: process.env.SESSION_SECRET,
      resave: false,
      cookie: {
        httpOnly: true,
        secure: __prod__,
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24 * 7 * 365, // 7 years,
        domain: __prod__ ? '.maxkrieg.com' : undefined
      }
    })
  )

  const schema = await buildSchema({
    resolvers: [HelloResolver, PostResolver, UserResolver],
    validate: false
  })

  const apolloServer = new ApolloServer({
    schema,
    context: ({ req, res }): RequestContext => ({
      req,
      res,
      redis,
      userLoader: createUserLoader(),
      upvoteLoader: createUpvoteLoader()
    }),
    plugins: [ApolloServerPluginLandingPageGraphQLPlayground()]
  })

  await apolloServer.start()

  apolloServer.applyMiddleware({
    app,
    cors: false
  })

  app.listen(parseInt(process.env.APP_PORT), () => {
    console.log(`🚀🚀🚀 App listening on port ${process.env.APP_PORT} 🚀🚀🚀`)
  })
}

main().catch(err => {
  console.log('======== ERROR ==========')
  console.error(err)
})
