export const getEnvConfig = () => ({
  BASE_URL:
    process.env.EXPO_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    'http://localhost:3000',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID_WEB!,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET_WEB!,
  GOOGLE_REDIRECT_URI: `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/callback/google`,
  JWT_SECRET: process.env.JWT_SECRET!,
  APPLE_CLIENT_ID: process.env.APPLE_CLIENT_ID!,
  APPLE_TEAM_ID: process.env.APPLE_TEAM_ID!,
  APPLE_KEY_ID: process.env.APPLE_KEY_ID!,
  APPLE_PRIVATE_KEY_P8: process.env.APPLE_PRIVATE_KEY_P8!,
})
