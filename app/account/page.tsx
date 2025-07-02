'use client'

import { useUser } from '@/contexts/user-context'
import { useTheme } from '@/contexts/theme-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Sun, Moon } from 'lucide-react'

export default function AccountPage() {
  const { user, loading } = useUser()
  const { theme, setTheme } = useTheme()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Account Settings</h1>
          
          <div className="space-y-6">
            <div>
              <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</h2>
              <p className="text-gray-900 dark:text-white">{user.email}</p>
            </div>

            <div className="border-t dark:border-gray-700 pt-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Appearance</h2>
              
              <div className="space-y-4">
                <button
                  onClick={() => setTheme('light')}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-colors ${
                    theme === 'light'
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Sun className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    <span className="text-gray-900 dark:text-white">Light mode</span>
                  </div>
                  {theme === 'light' && (
                    <div className="h-2 w-2 rounded-full bg-brand-500"></div>
                  )}
                </button>

                <button
                  onClick={() => setTheme('dark')}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-colors ${
                    theme === 'dark'
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Moon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    <span className="text-gray-900 dark:text-white">Dark mode</span>
                  </div>
                  {theme === 'dark' && (
                    <div className="h-2 w-2 rounded-full bg-brand-500"></div>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}