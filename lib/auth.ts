'use client'

import { useEffect, useState } from 'react'

export type UserRole = 'admin' | 'staff'

export function useAuth() {
  const [user, setUser] = useState<{ email: string; full_name: string; role: UserRole } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const userStr = localStorage.getItem('currentUser')
    if (userStr) {
      setUser(JSON.parse(userStr))
    }
    setLoading(false)
  }, [])

  return { user, loading }
}

export function useRequireAuth() {
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = '/login'
    }
  }, [user, loading])

  return { user, loading }
}

export function useRequireAdmin() {
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        window.location.href = '/login'
      } else if (user.role !== 'admin') {
        window.location.href = '/rules-booking'
      }
    }
  }, [user, loading])

  return { user, loading }
}
