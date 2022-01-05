import { User } from '../entities/User'
import { EmailPasswordInput } from '../resolvers/EmailPasswordInput'
import { validateEmail } from './validateEmail'

export const validateRegister = (
  { email, password }: EmailPasswordInput,
  existingUser: User | null
) => {
  if (existingUser) {
    return [
      {
        field: 'email',
        message: 'That email is already registered'
      }
    ]
  }

  if (!validateEmail(email)) {
    return [{ field: 'email', message: 'Invalid email' }]
  }

  // TODO: Stronger password complexity validation
  if (password.length <= 2) {
    return [{ field: 'password', message: 'Invalid password' }]
  }

  return null
}
