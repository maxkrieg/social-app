export const validatePassword = (password: string, field: string = 'password') => {
  // TODO: Stronger password complexity validation
  if (password.length <= 2) {
    return [{ field, message: 'Password length must be greater than 2' }]
  }

  return null
}
