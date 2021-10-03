import 'reflect-metadata'
import { HelloResolver } from './resolvers/hello'
import { MikroORM } from '@mikro-orm/core'
import { __prod__ } from './constants'
import mikroConfig from './mikro-orm.config'
import express from 'express'

import { ApolloServer } from 'apollo-server-express'
import { buildSchema } from 'type-graphql'
import { PostResolver } from './resolvers/post'
import { UserResolver } from './resolvers/user'

const main = async () => {
  const orm = await MikroORM.init(mikroConfig)
  await orm.getMigrator().up()

  const app = express()

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

  app.listen(4000, () => {
    console.log('🚀🚀🚀 App listening on port 4000 🚀🚀🚀')
  })
}

main().catch(err => {
  console.log('======== ERROR ==========')
  console.error(err)
})
