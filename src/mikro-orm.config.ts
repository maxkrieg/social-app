import { MikroORM } from '@mikro-orm/core'
import { __prod__ } from "./constants"
import { Post } from "./entities/Post"
import { User } from "./entities/User"
import path from 'path'

export default {
  dbName: 'social_app',
  entities: [Post, User],
  migrations: {
    path: path.join(__dirname, './migrations'),
    pattern: /^[\w-]+\d+\.[tj]s$/,
  },
  type: 'postgresql',
  user: 'postgres',

  password: 'postgres',
  debug: !__prod__
} as Parameters<typeof MikroORM.init>[0]; 
