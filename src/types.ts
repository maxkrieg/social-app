import { Request, Response } from 'express'
import { Connection, EntityManager, IDatabaseDriver } from 'mikro-orm'
import { Redis } from 'ioredis'

export type RequestContext = {
  em: EntityManager<any> & EntityManager<IDatabaseDriver<Connection>>
  req: Request
  res: Response
  redis: Redis
}
