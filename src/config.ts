import dotenv from 'dotenv'

// TODO: Switch to something like node-config eventually

const result = dotenv.config()
if (result.error) {
  throw result.error
}
const { parsed: env = {} } = result

console.log(JSON.stringify(env, null, 2))

export default {
  isProduction: env.NODE_ENV === 'production',
  port: env.APP_PORT || 4000,
  session: {
    name: env.SESSION_NAME || 'qid',
    secret: env.SESSION_SECRET || 'dev-secret'
  }
}
