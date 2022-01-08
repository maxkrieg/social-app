import { User } from '../entities/User'
import { EmailPasswordInput } from '../resolvers/EmailPasswordInput'
import { validateEmail } from './validateEmail'
import { validatePassword } from './validatePassword'

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

  let errors = []

  const emailErrors = validateEmail(email)
  if (emailErrors) errors.push(...emailErrors)

  const passwordErrors = validatePassword(password)
  if (passwordErrors) errors.push(...passwordErrors)

  if (errors.length > 0) return errors

  return null
}
