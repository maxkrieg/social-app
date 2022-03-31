import DataLoader from 'dataloader'
import { User } from '../entities/User'

export const createUserLoader = () =>
  new DataLoader<number, User>(async userIds => {
    const users = await User.findByIds(userIds as number[])
    const userIdToUser = users.reduce((acc: Record<number, User>, user: User) => {
      acc[user.id] = user
      return acc
    }, {})
    return userIds.map(userId => userIdToUser[userId])
  })
