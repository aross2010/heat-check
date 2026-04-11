import { createContext, useContext, useEffect, useRef, useState } from 'react'
import * as WebBrowser from 'expo-web-browser'
import * as AppleAuthentication from 'expo-apple-authentication'
import { randomUUID } from 'expo-crypto'
import {
  AuthError,
  AuthRequestConfig,
  DiscoveryDocument,
  makeRedirectUri,
  useAuthRequest,
} from 'expo-auth-session'
import {
  BASE_URL,
  REFRESH_TOKEN_KEY_NAME,
  TOKEN_KEY_NAME,
} from '@heat-check/shared'

import * as jose from 'jose'
import { tokenCache } from '../utils/cache'
import { useRouter } from 'expo-router'
import { Alert } from 'react-native'
import { useUserStore } from '../stores/user-store'
import { User, Provider } from '@heat-check/shared'

WebBrowser.maybeCompleteAuthSession()

export type AuthUser = {
  id: string
  email: string
  username: string
  provider: 'google' | 'apple'
  providerId: string // provider id
  exp?: number
}

type AuthContextType = {
  authUser: AuthUser | null
  signIn: () => void | Promise<void>
  signOut: () => void | Promise<void>
  signInWithApple: (deleteAccount: boolean) => void | Promise<void>
  fetchWithAuth: (url: string, options: RequestInit) => Promise<Response>
  linkAppleAccount: () => Promise<void>
  linkGoogleAccount: () => Promise<void>
  deleteAccount: () => Promise<void>
  isLoading: boolean
  error: AuthError | null
}

const AuthContext = createContext<AuthContextType>({
  authUser: null,
  signIn: () => {},
  signOut: () => {},
  signInWithApple: (deleteAccount: boolean) => {},
  fetchWithAuth: (url: string, options: RequestInit) =>
    Promise.resolve(new Response()),
  linkAppleAccount: async () => {},
  linkGoogleAccount: async () => {},
  deleteAccount: async () => {},
  isLoading: false,
  error: null,
})

const config: AuthRequestConfig = {
  clientId: 'google',
  scopes: ['openid', 'profile', 'email'],
  redirectUri: makeRedirectUri(),
}

const discovery: DiscoveryDocument = {
  authorizationEndpoint: `${BASE_URL}/api/auth/authorize`,
  tokenEndpoint: `${BASE_URL}/api/auth/token`,
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<AuthError | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [refreshToken, setRefreshToken] = useState<string | null>(null)
  const [request, response, promptAsync] = useAuthRequest(config, discovery)
  const refreshInProgressRef = useRef(false)
  const router = useRouter()
  const { setUser, user, clearUserStore } = useUserStore()

  useEffect(() => {
    const restoreSession = async () => {
      setIsLoading(true)
      try {
        const storedAccessToken = await tokenCache?.getToken(TOKEN_KEY_NAME)
        const storedRefreshToken = await tokenCache?.getToken(
          REFRESH_TOKEN_KEY_NAME,
        )
        if (storedAccessToken) {
          try {
            const decoded = jose.decodeJwt(storedAccessToken) as AuthUser
            const exp = decoded.exp
            const now = Math.floor(Date.now() / 1000)

            if (exp && exp > now) {
              // access token is still valid
              setAccessToken(storedAccessToken)

              if (storedRefreshToken) {
                setRefreshToken(storedRefreshToken)
              }

              setAuthUser(decoded)
            } else if (storedRefreshToken) {
              // access token expired, but we have a refresh token
              setRefreshToken(storedRefreshToken)
              await refreshAccessToken(storedRefreshToken)
            }
          } catch (error) {
            if (storedRefreshToken) {
              setRefreshToken(storedRefreshToken)
              await refreshAccessToken(storedRefreshToken)
            }
          }
        } else if (storedRefreshToken) {
          setRefreshToken(storedRefreshToken)
          await refreshAccessToken(storedRefreshToken)
        }
      } catch (error) {
        console.error('Error restoring session:', error)
      } finally {
        setIsLoading(false)
      }
    }

    restoreSession()
  }, [])

  // sync authUser to user store
  useEffect(() => {
    if (authUser) {
      setUser({
        id: authUser.id,
        email: authUser.email,
        username: authUser.username,
      })
    } else if (!isLoading) {
      // only clear when explicitly logged out, not during initial session restore
      clearUserStore()
    }
  }, [authUser, isLoading])

  useEffect(() => {
    // case where user is just linking their account and has accessToken, do not complete sign in
    if (!accessToken) handleResponse()
  }, [response])

  const refreshAccessToken = async (tokenToUse?: string) => {
    // prevent multiple simultaneous refresh attempts
    if (refreshInProgressRef.current) {
      return null
    }

    refreshInProgressRef.current = true

    try {
      // use the provided token or fall back to the state
      const currentRefreshToken = tokenToUse || refreshToken
      if (!currentRefreshToken) {
        signOut()
        return null
      }
      const refreshResponse = await fetch(`${BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: currentRefreshToken,
        }),
      })

      if (!refreshResponse.ok) {
        const errorData = await refreshResponse.json()
        // refresh fails due to expired token, sign out
        if (refreshResponse.status === 401) {
          signOut()
        }
        return null
      }
      const tokens = await refreshResponse.json()
      const newAccessToken = tokens.accessToken
      const newRefreshToken = tokens.refreshToken

      if (newAccessToken) setAccessToken(newAccessToken)
      if (newRefreshToken) setRefreshToken(newRefreshToken)

      if (newAccessToken)
        await tokenCache?.saveToken('accessToken', newAccessToken)
      if (newRefreshToken)
        await tokenCache?.saveToken('refreshToken', newRefreshToken)

      // update user data from the new access token
      if (newAccessToken) {
        const decoded = jose.decodeJwt(newAccessToken)

        setAuthUser(decoded as AuthUser)
      }

      return newAccessToken
    } catch (error) {
      signOut()
      return null
    } finally {
      refreshInProgressRef.current = false
    }
  }

  const handleResponse = async () => {
    if (response?.type === 'success') {
      try {
        setIsLoading(true)
        const { code } = response.params

        const tokenResponse = await fetch(`${BASE_URL}/api/auth/token`, {
          method: 'POST',
          body: JSON.stringify({ code }),
        })

        if (tokenResponse.status == 409) {
          Alert.alert(
            'Unsuccessful Sign In',
            'Email linked to Apple account, proceed with Apple. You may connect your Google account in the app.',
          )

          return
        }
        const tokens = await tokenResponse.json()
        await handleNativeTokens(tokens)
      } catch (error) {
        console.error('Error handling auth response:', error)
      } finally {
        setIsLoading(false)
      }
    } else if (response?.type === 'error') {
      setError(response.error as AuthError)
    }
  }

  const signIn = async () => {
    try {
      if (!request) {
        console.error('Auth request is not ready')
        return
      }
      await promptAsync()
    } catch (error) {
      console.error('Error during sign in:', error)
    }
  }

  const signOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Sign Out',
        onPress: async () => {
          await tokenCache?.deleteToken(TOKEN_KEY_NAME)
          await tokenCache?.deleteToken(REFRESH_TOKEN_KEY_NAME)
          setAuthUser(null)
          setAccessToken(null)
          setRefreshToken(null)
          clearUserStore()
          router.replace('/')
        },
      },
    ])
  }

  // helper function for apple sign in
  const signUp = async (
    email: string,
    firstName: string,
    lastName: string | null,
    provider: string,
    providerId: string,
  ) => {
    try {
      const res = await fetch(`${BASE_URL}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          firstName,
          lastName,
          provider,
          providerId,
        }),
      })

      if (res.status === 409) {
        const resData = await res.json()
        if (resData.error.includes('User already exists')) {
          // user is trying to sign up with credentials that already exist
        } else if (resData.error.includes('Google account already exists')) {
          // user is trying to sign up with apple but they already have a google account
          Alert.alert(
            'Unsuccessful Sign Up',
            'Email linked to Google account, proceed with Google. You may connect your Apple account in the app.',
          )
        } else if (resData.error.includes('Apple account already exists')) {
          // user is trying to sign up with google but they already have an apple account
          Alert.alert(
            'Unsuccessful Sign Up',
            'Email linked to Apple account, proceed with Apple. You may connect your Google account in the app.',
          )
        }

        return {
          status: 409,
        }
      }

      const data = await res.json()
      return data
    } catch (error) {
      console.error('Error during sign up:', error)
      Alert.alert(
        'Unsuccessful Sign Up',
        'An error occurred during sign up. Please try again.',
      )
    }
  }

  const signInWithApple = async (deleteAccount: boolean = false) => {
    try {
      const rawNonce = randomUUID()
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: rawNonce,
      })
      setIsLoading(true)

      if (credential.fullName?.givenName && credential.email) {
        // first time signing in w/ Apple, store key credentials to db
        // save to cache in case sign up fails

        try {
          let exists = false
          const response = await signUp(
            credential.email,
            credential.fullName.givenName,
            credential.fullName.familyName ?? null,
            'apple',
            credential.user,
          )

          if (response?.status === 409) {
            exists = true
            // user has signed up before with apple but either deleted account or is signing in on a new device
          }

          if (!exists) {
            tokenCache?.saveAppleDetails({
              email: credential.email,
              givenName: credential.fullName?.givenName,
              familyName: credential.fullName?.familyName ?? null,
            })
          }
        } catch (error) {
          console.error('Error during Apple sign up:', error)
        }
      }
      let appleResponse
      appleResponse = await fetch(`${BASE_URL}/api/auth/apple/apple-native`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identityToken: credential.identityToken,
          rawNonce,
          providerId: credential.user,
        }),
      })

      if (appleResponse.status === 404) {
        // user could not be found, sign up with cache details and try again
        const appleUserDetails = await tokenCache?.getAppleDetails()
        if (!appleUserDetails) {
          Alert.alert(
            'Apple Sign Up Failed',
            'You previously deleted an account with Apple credentials. To recover your account, continue with Google and link your Apple account.',
          )
          return
        }
        const res = await signUp(
          appleUserDetails?.email,
          appleUserDetails?.givenName ?? '',
          appleUserDetails?.familyName ?? null,
          'apple',
          credential.user,
        )

        if (res.status === 409) {
          return
        }

        appleResponse = await fetch(`${BASE_URL}/api/auth/apple/apple-native`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            identityToken: credential.identityToken,
            rawNonce,
            providerId: credential.user,
          }),
        })
      }

      if (appleResponse.status !== 200) {
      }

      const tokens = await appleResponse.json()
      if (deleteAccount) return tokens
      await handleNativeTokens(tokens)
    } catch (error) {
      console.error('Error during Apple sign in:', error)
      setError(error as AuthError)
    } finally {
      setIsLoading(false)
    }
  }

  const handleNativeTokens = async (tokens: {
    accessToken: string
    refreshToken?: string
  }) => {
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      tokens

    if (newAccessToken) setAccessToken(newAccessToken)
    if (newRefreshToken) setRefreshToken(newRefreshToken)

    if (newAccessToken)
      await tokenCache?.saveToken('accessToken', newAccessToken)
    if (newRefreshToken)
      await tokenCache?.saveToken('refreshToken', newRefreshToken)
    if (newAccessToken) {
      const decoded = jose.decodeJwt(newAccessToken)
      const user = decoded as AuthUser
      setAuthUser(user)
      await getAndSetUser(user.id, newAccessToken)
    }
  }

  const fetchWithAuth = async (url: string, options: RequestInit) => {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (response.status === 401) {
      console.error('Fetch received 401, attempting token refresh')
      const newToken = await refreshAccessToken()

      if (newToken) {
        return fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            Authorization: `Bearer ${newToken}`,
          },
        })
      }
    }

    if (!response.ok) {
      const clonedResponse = response.clone()
      try {
        const { error } = await clonedResponse.json()
        console.error('Throwing error from fetchWithAuth:', error)
        if (error != 'Token expired' && error != 'Already Read')
          throw new Error(error)
      } catch (parseError) {
        throw new Error(`Request failed with status ${response.status}`)
      }
    }

    return response
  }

  // for user store when a user logs in
  const getAndSetUser = async (userId: string, newAccessToken: string) => {
    try {
      const response = await fetch(`${BASE_URL}/api/users/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${newAccessToken}`,
        },
      })
      const userProfile = (await response.json()) as User
      setUser(userProfile)
    } catch (error) {}
  }

  const linkAppleAccount = async () => {
    if (!user) {
      return
    }

    const rawNonce = randomUUID()
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: rawNonce,
    })
    const providerId = credential.user
    let providerEmail = credential.email

    if (!providerEmail) {
      const appleUserDetails = await tokenCache.getAppleDetails()
      providerEmail = appleUserDetails?.email ?? null
    }

    try {
      const response = await fetchWithAuth(
        `${BASE_URL}/api/users/link/apple/${user.id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            providerId,
            providerEmail,
          }),
        },
      )

      if (response.status === 200) {
        const { updatedLinkedAccount } = await response.json()
        tokenCache.saveAppleDetails({
          email: user.email,
        })
        Alert.alert(
          'Success',
          'Apple account successfully linked. You can now sign in with Apple.',
        )
      }
    } catch (error) {
      setError(error as AuthError)
    }
  }

  const linkGoogleAccount = async () => {
    if (!user) {
      console.error('No user found')
      return
    }
    await signIn()
    if (!request) {
      Alert.alert('Error', 'Failed to sign in with Google. Please try again.')
      return
    }

    if (response?.type === 'success') {
      const { code } = response.params
      try {
        const response = await fetchWithAuth(
          `${BASE_URL}/api/users/link/google/${user.id}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code }),
          },
        )

        if (response.status === 200) {
          const { updatedLinkedAccount } = await response.json()
          Alert.alert(
            'Success',
            'Google account successfully linked. You can now sign in with Google.',
          )
        }
      } catch (error) {
        setError(error as AuthError)
        console.error('Error linking Google account:', error)
      }
    }
  }

  const promptAppleReAuth = async (): Promise<Boolean> => {
    return new Promise((resolve) => {
      Alert.alert(
        'Sign in with Apple',
        'You must sign in with Apple to delete your account.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Sign In',
            onPress: async () => {
              resolve(true)
            },
          },
        ],
        { cancelable: true },
      )
    })
  }

  const deleteAccount = async () => {
    if (!user) {
      return
    }

    try {
      setIsLoading(true)
      // get user providers
      const res = await fetchWithAuth(`${BASE_URL}/api/users/${user.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      const { providers } = await res.json()

      // if auth User provider == apple, send refresh token, else prompt login to get refresh token
      let appleRefreshToken =
        authUser?.provider == 'apple' ? refreshToken : null

      if (
        !appleRefreshToken &&
        providers.some((p: Provider) => p.name === 'apple')
      ) {
        const confirm = await promptAppleReAuth()
        if (!confirm) return

        const tokens = await signInWithApple(true)
        if (!tokens.refreshToken) {
          Alert.alert(
            'Error',
            'Failed to sign in with Apple. Please try again.',
          )
          return
        }
        appleRefreshToken = tokens.refreshToken
      }

      const response = await fetchWithAuth(`${BASE_URL}/api/users/${user.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ appleRefreshToken }),
      })

      if (response.status === 200) {
        router.back()
        signOut()
        Alert.alert(
          'Account Deleted',
          'Your account has been successfully deleted.',
        )
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'An unexpected error occurred while deleting your account.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        authUser,
        signIn,
        signOut,
        signInWithApple,
        fetchWithAuth,
        linkAppleAccount,
        linkGoogleAccount,
        deleteAccount,
        isLoading,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
