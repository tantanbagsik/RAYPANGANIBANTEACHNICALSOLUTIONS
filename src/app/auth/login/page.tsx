'use client'
import { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const callbackUrl = params.get('callbackUrl') ?? '/dashboard'
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await signIn('credentials', { ...form, redirect: false })
    setLoading(false)
    if (res?.error) {
      toast.error(res.error)
    } else {
      toast.success('Welcome back!')
      router.push(callbackUrl)
    }
  }

  async function handleOAuth(provider: string) {
    await signIn(provider, { callbackUrl })
  }

  return (
    <div className="min-h-screen hero-bg flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg shimmer-btn flex items-center justify-center text-sm font-bold font-sora">R</div>
            <span className="font-sora font-bold text-xl gradient-text">Raypanganiban</span>
          </Link>
          <h1 className="font-sora font-bold text-3xl mb-2">Welcome back</h1>
          <p className="text-gray-400 text-sm">Sign in to continue learning</p>
        </div>

        <div className="glow-card p-8">
          {/* OAuth buttons */}
          <div className="flex gap-3 mb-6">
            {[
              { provider: 'google', label: 'Google', icon: 'G' },
              { provider: 'facebook', label: 'Facebook', icon: 'f' },
              { provider: 'github', label: 'GitHub', icon: '⌥' },
            ].map(({ provider, label, icon }) => (
              <button key={provider} onClick={() => handleOAuth(provider)}
                className="flex-1 flex items-center justify-center gap-2 border border-border hover:border-primary/50 py-2.5 rounded-xl text-sm text-gray-300 hover:text-white transition-all">
                <span className="font-bold">{icon}</span> {label}
              </button>
            ))}
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative text-center"><span className="bg-card px-3 text-gray-500 text-xs">or continue with email</span></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <input type="email" required value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                className="input-base" placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} required value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  className="input-base pr-10" placeholder="••••••••" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link href="/auth/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
            </div>

            <button type="submit" disabled={loading}
              className="w-full shimmer-btn text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</> : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6">
            Don't have an account?{' '}
            <Link href="/auth/register" className="text-primary hover:underline font-medium">Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen hero-bg flex items-center justify-center"><div className="text-white">Loading...</div></div>}>
      <LoginForm />
    </Suspense>
  )
}
