import { Request, Response } from 'express'
import { Redis } from 'ioredis'
import { createUpvoteLoader } from './utils/createUpvoteLoader'
import { createUserLoader } from './utils/createUserLoader'

export type RequestContext = {
  req: Request
  res: Response
  redis: Redis
  userLoader: ReturnType<typeof createUserLoader>
  upvoteLoader: ReturnType<typeof createUpvoteLoader>
}
