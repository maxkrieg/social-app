import { MiddlewareFn } from 'type-graphql'
import { RequestContext } from '../types'

export const isAuthenticated: MiddlewareFn<RequestContext> = ({ context }, next) => {
  if (!context.req.session.userId) {
    throw new Error('Unauthenticated')
  }
  return next()
}
