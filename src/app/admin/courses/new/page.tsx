'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Loader2 } from 'lucide-react'

export default function NewCoursePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'authenticated') {
      const user = session?.user as any
      if (user?.role === 'admin') {
        router.replace('/admin/courses/new-form')
      } else {
        router.replace('/')
      }
    } else if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, session, router])

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  )
}