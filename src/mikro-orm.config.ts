import { MikroORM } from '@mikro-orm/core'
import path from 'path'

import config from './config'
import { Post } from './entities/Post'
import { User } from './entities/User'

export default {
  dbName: 'social_app',
  entities: [Post, User],
  migrations: {
    path: path.join(__dirname, './migrations'),
    pattern: /^[\w-]+\d+\.[tj]s$/
  },
  type: 'postgresql',
  user: 'postgres',

  password: 'postgres',
  debug: !config.isProduction
} as Parameters<typeof MikroORM.init>[0]
