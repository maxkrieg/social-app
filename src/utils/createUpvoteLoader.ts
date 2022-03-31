import DataLoader from 'dataloader'
import { Upvote } from '../entities/Upvote'

export const createUpvoteLoader = () =>
  new DataLoader<{ postId: number; userId: number }, Upvote | null>(async keys => {
    const upvotes = await Upvote.findByIds(keys as any)
    const upvoteIdToUpvote = upvotes.reduce((acc: Record<string, Upvote>, upvote: Upvote) => {
      acc[`${upvote.userId}|${upvote.postId}`] = upvote
      return acc
    }, {})
    return keys.map(key => upvoteIdToUpvote[`${key.userId}|${key.postId}`] || null)
  })
