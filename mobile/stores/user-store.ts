import { MMKV } from 'react-native-mmkv'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { User } from '@heat-check/shared'

type UserStore = {
  user: User | null
  setUser: (user: User | null) => void
  clearUserStore: () => void
}

const initialUser = {
  id: null,
  username: '',
  email: '',
}

const kv = new MMKV({ id: 'heat-check-user-store' })
const storage = {
  getItem: (key: string) => kv.getString(key) ?? null,
  setItem: (key: string, value: string) => kv.set(key, value),
  removeItem: (key: string) => kv.delete(key),
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      user: initialUser,
      setUser: (u) =>
        set((s) => ({
          user: {
            id:
              u && typeof u.id !== 'undefined'
                ? u.id
                : s.user
                  ? s.user.id
                  : null,
            email: u && u.email ? u.email.trim() : s.user ? s.user.email : '',
            username:
              u && u.username
                ? u.username.trim()
                : s.user
                  ? s.user.username
                  : '',
          },
        })),
      clearUserStore: () =>
        set((s) => ({
          user: initialUser,
        })),
    }),
    {
      name: 'heat-check-user-store',
      storage: createJSONStorage(() => storage),
      version: 2,
    },
  ),
)
