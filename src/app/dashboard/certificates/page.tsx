'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Award, Trophy, ArrowRight } from 'lucide-react'

interface Certificate {
  _id: string
  course: {
    title: string
    slug: string
    thumbnail: string
    category: string
    instructor: { name: string }
  }
  completedAt: string
}

export default function CertificatesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/dashboard/certificates')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchCertificates()
    }
  }, [status])

  const fetchCertificates = async () => {
    try {
      const res = await fetch('/api/certificates')
      if (res.ok) {
        const data = await res.json()
        setCertificates(data.certificates)
      }
    } catch (error) {
      console.error('Error fetching certificates:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark pt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="font-sora font-bold text-3xl flex items-center gap-3">
            <Award className="w-8 h-8 text-[#fbbf24]" />
            My Certificates
          </h1>
          <p className="text-gray-400 mt-2">Your earned certificates from completed courses</p>
        </div>

        {certificates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certificates.map((cert) => (
              <div key={cert._id} className="glow-card overflow-hidden group">
                <div className="h-40 bg-gradient-to-br from-[#fbbf24]/20 to-[#f59e0b]/10 relative overflow-hidden">
                  {cert.course.thumbnail ? (
                    <img src={cert.course.thumbnail} alt={cert.course.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Award className="w-16 h-16 text-[#fbbf24]/50" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-dark/80 to-transparent" />
                  <div className="absolute top-3 right-3 bg-[#fbbf24] text-dark text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                    <Trophy className="w-3 h-3" /> Certified
                  </div>
                </div>
                <div className="p-5">
                  <span className="badge text-[#fbbf24] border-[#fbbf24]/30 bg-[#fbbf24]/10 text-xs mb-2 inline-flex">
                    {cert.course.category}
                  </span>
                  <h3 className="font-sora font-semibold text-lg mb-2 line-clamp-2">
                    {cert.course.title}
                  </h3>
                  <p className="text-gray-500 text-sm mb-4">
                    by {cert.course.instructor?.name}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {new Date(cert.completedAt).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </span>
                    <Link 
                      href={`/dashboard/certificate/${cert._id}`}
                      className="flex items-center gap-1 text-[#fbbf24] text-sm font-medium hover:underline"
                    >
                      View <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#fbbf24]/20 to-[#f59e0b]/10 flex items-center justify-center">
              <Award className="w-12 h-12 text-[#fbbf24]/50" />
            </div>
            <h3 className="font-sora font-semibold text-xl mb-3">No certificates yet</h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Complete a course to earn your first certificate. Keep learning and showcase your achievements!
            </p>
            <Link href="/courses" className="btn-primary inline-block">
              Browse Courses
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
