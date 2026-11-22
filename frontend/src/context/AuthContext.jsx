
import { createContext, useContext, useEffect, useState } from 'react'
import { api } from '@/api/client'

const AuthContext = createContext(null)

function normalizeUser(data) {
  if (!data || typeof data !== 'object') {
    return null
  }

  // Support APIs that return the user directly or inside a "user" property.
  const userData =
    data.user && typeof data.user === 'object'
      ? data.user
      : data

  const role = String(
    userData.role ?? userData.user_role ?? ''
  )
    .trim()
    .toLowerCase()

  return {
    ...userData,
    role,
    is_superuser: userData.is_superuser === true,
    is_staff: userData.is_staff === true,
  }
}

export function AuthProvider({ children }) {
  // undefined = loading, null = not logged in
  const [user, setUser] = useState(undefined)

  useEffect(() => {
    let active = true

    api
      .get('/auth/me/')
      .then((data) => {
        if (active) {
          setUser(normalizeUser(data))
        }
      })
      .catch(() => {
        if (active) {
          setUser(null)
        }
      })

    return () => {
      active = false
    }
  }, [])

  // Listen for unauthorized API responses.
  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null)
    }

    window.addEventListener('auth:unauthorized', handleUnauthorized)

    return () => {
      window.removeEventListener(
        'auth:unauthorized',
        handleUnauthorized
      )
    }
  }, [])

  const login = async (username, password) => {
    const data = await api.post('/auth/login/', {
      username,
      password,
    })

    const normalizedUser = normalizeUser(data)

    if (!normalizedUser) {
      throw new Error('Login succeeded, but user information was not returned.')
    }

    setUser(normalizedUser)
    return normalizedUser
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout/', {})
    } catch {
      // Clear the local user state even if the logout request fails.
    } finally {
      setUser(null)
    }
  }

  const value = {
    user,
    login,
    logout,
    isLoading: user === undefined,
    isAuthenticated: Boolean(user),
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)

  if (context === null) {
    throw new Error(
      'useAuth must be used inside an AuthProvider.'
    )
  }

  return context
}
