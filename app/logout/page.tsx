'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, CheckCircle } from 'lucide-react'

export default function LogoutPage() {
  const router = useRouter()

  useEffect(() => {
    // Clear user session
    localStorage.removeItem('currentUser')

    // Redirect to login after showing message
    const timer = setTimeout(() => {
      router.push('/login')
    }, 2000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto h-20 w-20 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="text-green-600" size={40} />
        </div>

        <div>
          <h2 className="text-3xl font-extrabold text-gray-900">
            Logged Out Successfully
          </h2>
          <p className="mt-2 text-lg text-gray-600">
            You have been logged out of the system
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 text-gray-500">
          <LogOut size={20} />
          <p>Redirecting to login page...</p>
        </div>
      </div>
    </div>
  )
}
