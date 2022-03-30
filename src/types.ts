import DataLoader from 'dataloader'
import { Request, Response } from 'express'
import { Redis } from 'ioredis'
import { User } from './entities/User'

export type RequestContext = {
  req: Request
  res: Response
  redis: Redis
  userLoader: DataLoader<number, User>
}
