declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: string
      APP_PORT: string
      DATABASE_URL: string
      REDIS_URL: string
      SESSION_SECRET: string
      CORS_ORIGIN: string
    }
  }
}

export {}
