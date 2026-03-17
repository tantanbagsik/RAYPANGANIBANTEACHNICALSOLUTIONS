'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { Menu, X, ChevronDown, LogOut, LayoutDashboard, BookOpen, Settings, ShoppingCart, Zap, Plus } from 'lucide-react'
import { useCart } from '@/context/CartContext'

const navLinks = [
  { href: '/#courses', label: 'Courses' },
  { href: '/#features', label: 'Features' },
  { href: '/#pricing', label: 'Pricing' },
]

export function Navbar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [userPoints, setUserPoints] = useState(0)
  const { getItemCount } = useCart()

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => {
    if (session?.user) {
      fetch('/api/points')
        .then(res => res.json())
        .then(data => setUserPoints(data.points || 0))
        .catch(console.error)
    }
  }, [session])

  useEffect(() => {
    setUserMenuOpen(false)
    setMobileOpen(false)
  }, [pathname])

  const user = session?.user as any
  const cartCount = getItemCount()

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300
        ${scrolled ? 'bg-dark/90 border-b border-border backdrop-blur-xl shadow-lg shadow-black/20' : 'bg-transparent'}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg shimmer-btn flex items-center justify-center text-sm font-bold font-sora">R</div>
            <span className="font-sora font-bold text-xl gradient-text">Raypanganiban</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map(link => (
              <Link key={link.href} href={link.href} className="nav-link">{link.label}</Link>
            ))}
          </div>

          {/* Auth buttons */}
          <div className="hidden md:flex items-center gap-3">
            {session ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xs font-bold">
                    {user?.name?.[0]?.toUpperCase() ?? 'U'}
                  </div>
                  <span className="max-w-[120px] truncate">{user?.name}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-border">
                      <p className="text-xs text-gray-500">Signed in as</p>
                      <p className="text-sm font-medium truncate">{user?.email}</p>
                    </div>
                    
                    {/* Points Display */}
                    <div className="px-4 py-3 bg-gradient-to-r from-yellow-400/10 to-orange-400/10 border-b border-border">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-yellow-400" />
                          <span className="text-sm text-gray-400">Points Balance</span>
                        </div>
                        <span className="font-bold text-yellow-400">{userPoints.toLocaleString()}</span>
                      </div>
                      <Link 
                        href="/topup" 
                        onClick={() => setUserMenuOpen(false)}
                        className="mt-2 flex items-center justify-center gap-1 text-xs bg-yellow-400/20 text-yellow-400 py-1.5 rounded-lg hover:bg-yellow-400/30 transition-colors"
                      >
                        <Plus className="w-3 h-3" /> Top Up Points
                      </Link>
                    </div>

                    <Link href="/dashboard" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-border hover:text-white transition-colors" onClick={() => setUserMenuOpen(false)}>
                      <LayoutDashboard className="w-4 h-4" /> Dashboard
                    </Link>
                    <Link href="/dashboard/courses" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-border hover:text-white transition-colors" onClick={() => setUserMenuOpen(false)}>
                      <BookOpen className="w-4 h-4" /> My Courses
                    </Link>
                    {user?.role === 'admin' && (
                      <Link href="/admin" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-border hover:text-white transition-colors" onClick={() => setUserMenuOpen(false)}>
                        <Settings className="w-4 h-4" /> Admin Panel
                      </Link>
                    )}
                    <button
                      onClick={() => { signOut({ callbackUrl: '/' }); setUserMenuOpen(false) }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/auth/login" className="nav-link px-4 py-2">Login</Link>
                <Link href="/auth/register" className="btn-primary">Get Started</Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button className="md:hidden text-gray-400 hover:text-white" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-dark/95 backdrop-blur-xl px-4 py-4 space-y-3">
          {navLinks.map(link => (
            <Link key={link.href} href={link.href} className="block nav-link py-2" onClick={() => setMobileOpen(false)}>
              {link.label}
            </Link>
          ))}
          {session ? (
            <>
              {/* Points in mobile */}
              <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-yellow-400/10 to-orange-400/10 rounded-lg">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  <span className="text-gray-400">Points</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-yellow-400">{userPoints.toLocaleString()}</span>
                  <Link href="/topup" onClick={() => setMobileOpen(false)} className="text-xs bg-yellow-400/20 text-yellow-400 px-2 py-1 rounded-lg">
                    + Top Up
                  </Link>
                </div>
              </div>
              <Link href="/dashboard" className="block nav-link py-2" onClick={() => setMobileOpen(false)}>Dashboard</Link>
              <button onClick={() => signOut({ callbackUrl: '/' })} className="block text-red-400 text-sm py-2">Sign Out</button>
            </>
          ) : (
            <div className="flex flex-col gap-2 pt-2">
              <Link href="/auth/login" className="btn-outline text-center" onClick={() => setMobileOpen(false)}>Login</Link>
              <Link href="/auth/register" className="btn-primary text-center" onClick={() => setMobileOpen(false)}>Get Started</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}
