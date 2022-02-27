import { User } from '../entities/User'
import { RegisterInput } from '../resolvers/RegisterInput'
import { validateEmail } from './validateEmail'
import { validatePassword } from './validatePassword'
import { validateUsername } from './validateUsername'

export const validateRegister = (
  { email, username, password }: RegisterInput,
  existingUser?: User
) => {
  if (existingUser) {
    return [
      {
        field: 'email',
        message: 'That user is already registered'
      }
    ]
  }

  const errors = [
    validateEmail(email),
    validateUsername(username),
    validatePassword(password)
  ].filter(validationResult => validationResult !== null)

  if (errors.length > 0) return errors

  return null
}
