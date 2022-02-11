import 'reflect-metadata'

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

import config from './config'
import { Post } from './entities/Post'
import { User } from './entities/User'
import { HelloResolver } from './resolvers/hello'
import { PostResolver } from './resolvers/post'
import { UserResolver } from './resolvers/user'
import { RequestContext } from './types'

const main = async () => {
  console.log({ config })

  const conn = await createConnection({
    type: 'postgres',
    database: 'social_app2',
    username: 'postgres',
    password: 'postgres',
    logging: true,
    migrations: [path.join(__dirname, './migrations/*')],
    synchronize: true,
    entities: [User, Post]
  })
  await conn.runMigrations()

  const app = express()

  const RedisStore = connectRedis(session)
  const redis = new Redis()

  app.use(
    cors({
      origin: 'http://localhost:3000',
      credentials: true
    })
  )
  app.use(
    session({
      name: config.session.name,
      store: new RedisStore({
        client: redis,
        disableTouch: true
      }),
      saveUninitialized: false,
      secret: config.session.secret,
      resave: false,
      cookie: {
        httpOnly: true,
        secure: config.isProduction,
        sameSite: config.session.sameSite,
        maxAge: 1000 * 60 * 60 * 24 * 7 * 365 // 7 years
      }
    })
  )

  const schema = await buildSchema({
    resolvers: [HelloResolver, PostResolver, UserResolver],
    validate: false
  })

  const apolloServer = new ApolloServer({
    schema,
    context: ({ req, res }): RequestContext => ({ req, res, redis }),
    plugins: [ApolloServerPluginLandingPageGraphQLPlayground()]
  })

  await apolloServer.start()

  apolloServer.applyMiddleware({
    app,
    cors: false
  })

  app.listen(config.port, () => {
    console.log('🚀🚀🚀 App listening on port 4000 🚀🚀🚀')
  })
}

main().catch(err => {
  console.log('======== ERROR ==========')
  console.error(err)
})
