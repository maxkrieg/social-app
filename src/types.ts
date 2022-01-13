import { Request, Response } from 'express'
import { Redis } from 'ioredis'

export type RequestContext = {
  req: Request
  res: Response
  redis: Redis
}
