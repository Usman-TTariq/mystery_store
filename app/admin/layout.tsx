'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  
  // Use useMemo to create client only once
  const supabase = useMemo(() => createClient(), [])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authLoadingLocal, setAuthLoadingLocal] = useState(false)
  const [authErrorLocal, setAuthErrorLocal] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    // Check authentication
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      setUser(user)
      setLoading(false)

      if (!user && pathname !== '/admin/login' && pathname !== '/admin') {
        router.push('/admin/login')
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (!session?.user && pathname !== '/admin/login' && pathname !== '/admin') {
        router.push('/admin/login')
      }
    })

    return () => subscription.unsubscribe()
  }, [router, pathname, supabase])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/admin/login')
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl font-semibold">Loading...</div>
      </div>
    )
  }

  if (!user) {
    if (pathname === '/admin/login' || pathname === '/admin') {
      return <>{children}</>
    }

    const handleLocalSignIn = async (e?: React.FormEvent) => {
      e?.preventDefault()
      setAuthErrorLocal(null)
      setAuthLoadingLocal(true)
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        router.push('/admin/dashboard')
      } catch (err: any) {
        setAuthErrorLocal(err?.message || 'Sign in failed')
      } finally {
        setAuthLoadingLocal(false)
      }
    }

    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md text-center w-full max-w-md">
          <h2 className="text-2xl font-bold mb-3">Admin Access Required</h2>
          <p className="text-gray-600 mb-4">Sign in with your admin email and password to continue.</p>

          {authErrorLocal && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{authErrorLocal}</div>
          )}

          <form onSubmit={handleLocalSignIn} className="space-y-3">
            <input
              id="admin-email"
              name="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              required
            />
            <input
              id="admin-password"
              name="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              required
            />

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={authLoadingLocal}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {authLoadingLocal ? 'Signing in...' : 'Sign in'}
              </button>
              <Link href="/admin/login" className="flex-1 inline-flex items-center justify-center border border-gray-300 px-4 py-2 rounded-lg">
                Advanced Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-100 relative">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white shadow-lg transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-4 lg:p-6 flex items-center justify-between">
          <h1 className="text-xl lg:text-2xl font-bold">Admin Panel</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="mt-6">
          <Link
            href="/admin/dashboard"
            onClick={() => setSidebarOpen(false)}
            className="block px-4 lg:px-6 py-3 hover:bg-gray-800 transition text-sm lg:text-base"
          >
            Dashboard
          </Link>
          <Link
            href="/admin/coupons"
            onClick={() => setSidebarOpen(false)}
            className="block px-4 lg:px-6 py-3 hover:bg-gray-800 transition text-sm lg:text-base"
          >
            Manage Coupons
          </Link>
          <Link
            href="/admin/categories"
            onClick={() => setSidebarOpen(false)}
            className="block px-4 lg:px-6 py-3 hover:bg-gray-800 transition text-sm lg:text-base"
          >
            Manage Categories
          </Link>
          <Link
            href="/admin/banners"
            onClick={() => setSidebarOpen(false)}
            className="block px-4 lg:px-6 py-3 hover:bg-gray-800 transition text-sm lg:text-base"
          >
            Manage Banners
          </Link>
          <Link
            href="/admin/stores"
            onClick={() => setSidebarOpen(false)}
            className="block px-4 lg:px-6 py-3 hover:bg-gray-800 transition text-sm lg:text-base"
          >
            Manage Stores
          </Link>
          <Link
            href="/admin/logos"
            onClick={() => setSidebarOpen(false)}
            className="block px-4 lg:px-6 py-3 hover:bg-gray-800 transition text-sm lg:text-base"
          >
            Manage Logos
          </Link>
          <Link
            href="/admin/news"
            onClick={() => setSidebarOpen(false)}
            className="block px-4 lg:px-6 py-3 hover:bg-gray-800 transition text-sm lg:text-base"
          >
            Manage News & Articles
          </Link>
          <Link
            href="/admin/email"
            onClick={() => setSidebarOpen(false)}
            className="block px-4 lg:px-6 py-3 hover:bg-gray-800 transition text-sm lg:text-base"
          >
            Manage Email
          </Link>
          <Link
            href="/admin/faqs"
            onClick={() => setSidebarOpen(false)}
            className="block px-4 lg:px-6 py-3 hover:bg-gray-800 transition text-sm lg:text-base"
          >
            Manage FAQs
          </Link>
          <Link
            href="/admin/analytics"
            onClick={() => setSidebarOpen(false)}
            className="block px-4 lg:px-6 py-3 hover:bg-gray-800 transition text-sm lg:text-base"
          >
            Analytics
          </Link>
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 lg:px-6 py-3 hover:bg-red-600 transition mt-auto text-sm lg:text-base"
          >
            Logout
          </button>
        </nav>
      </aside>

      <main className="flex-1 overflow-auto w-full lg:w-auto">
        <div className="lg:hidden bg-gray-900 text-white p-4 flex items-center justify-between sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-white hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-lg font-bold">Admin Panel</h1>
          <div className="w-6"></div>
        </div>

        <div className="p-4 sm:p-6 lg:p-8">
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-2">
              <h2 className="text-base sm:text-lg lg:text-xl text-gray-800 break-words">
                Welcome, {user.email}
              </h2>
            </div>
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
