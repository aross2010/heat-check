import * as SecureStore from 'expo-secure-store'

type AppleDetails = {
  email: string
  givenName?: string | null
  familyName?: string | null
}

const APPLE_DETAILS_KEY = 'apple_signup_details'

type TokenCache = {
  getToken: (key: string) => Promise<string | null>
  saveToken: (key: string, token: string) => Promise<void>
  deleteToken: (key: string) => Promise<void>
  saveAppleDetails: (d: AppleDetails) => Promise<void>
  getAppleDetails: () => Promise<AppleDetails | null>
  clearAppleDetails: () => Promise<void>
}

const createTokenCache = (): TokenCache => {
  return {
    getToken: async (key: string) => {
      try {
        const item = await SecureStore.getItemAsync(key)
        if (item === null) {
          await SecureStore.deleteItemAsync(key)
          return null
        }
        return item
      } catch (error) {
        await SecureStore.deleteItemAsync(key)
        return null
      }
    },
    saveToken: async (key: string, token: string) => {
      return await SecureStore.setItemAsync(key, token)
    },
    deleteToken: async (key: string) => {
      return SecureStore.deleteItemAsync(key)
    },
    saveAppleDetails: async (d) => {
      await SecureStore.setItemAsync(APPLE_DETAILS_KEY, JSON.stringify(d))
    },
    getAppleDetails: async () => {
      const raw = await SecureStore.getItemAsync(APPLE_DETAILS_KEY)
      if (!raw) return null
      try {
        return JSON.parse(raw) as AppleDetails
      } catch {
        await SecureStore.deleteItemAsync(APPLE_DETAILS_KEY)
        return null
      }
    },
    clearAppleDetails: async () => {
      await SecureStore.deleteItemAsync(APPLE_DETAILS_KEY)
    },
  }
}

export const tokenCache = createTokenCache()
