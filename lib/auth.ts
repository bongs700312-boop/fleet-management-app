'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export type UserRole = 'admin' | 'staff'

export function useAuth() {
  const [user, setUser] = useState<{ email: string; full_name: string; role: UserRole } | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

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
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  return { user, loading }
}

export function useRequireAdmin() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login')
      } else if (user.role !== 'admin') {
        router.push('/rules-booking')
      }
    }
  }, [user, loading, router])

  return { user, loading }
}
