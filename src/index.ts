import 'reflect-metadata'

import { MikroORM } from '@mikro-orm/core'
import { ApolloServer } from 'apollo-server-express'
import connectRedis from 'connect-redis'
import express from 'express'
import session from 'express-session'
import redis from 'redis'
import { buildSchema } from 'type-graphql'

import config from './config'
import mikroConfig from './mikro-orm.config'
import { HelloResolver } from './resolvers/hello'
import { PostResolver } from './resolvers/post'
import { UserResolver } from './resolvers/user'

const main = async () => {
  const orm = await MikroORM.init(mikroConfig)
  await orm.getMigrator().up()

  const app = express()

  const RedisStore = connectRedis(session)
  const redisClient = redis.createClient()

  app.use(
    session({
      name: config.session.name,
      store: new RedisStore({
        client: redisClient,
        disableTouch: true
      }),
      saveUninitialized: false,
      secret: config.session.secret,
      resave: false,
      cookie: {
        httpOnly: true,
        secure: config.isProduction,
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
    context: () => ({ em: orm.em })
  })

  await apolloServer.start()

  apolloServer.applyMiddleware({ app })

  app.listen(config.port, () => {
    console.log('🚀🚀🚀 App listening on port 4000 🚀🚀🚀')
  })
}

main().catch(err => {
  console.log('======== ERROR ==========')
  console.error(err)
})
