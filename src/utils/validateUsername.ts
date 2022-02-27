export const validateUsername = (username: string) => {
  if (username.length < 3) {
    return [
      {
        field: 'username',
        message: 'Username must be at least 3 characters long'
      }
    ]
  }
  return null
}
