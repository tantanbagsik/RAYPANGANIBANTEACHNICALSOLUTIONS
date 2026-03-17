'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, ArrowLeft, Award, Download, Share2, CheckCircle } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'

interface CertificateData {
  _id: string
  course: {
    title: string
    instructor: { name: string }
    category: string
  }
  user: { name: string }
  completedAt: string
}

export default function CertificatePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const [certificate, setCertificate] = useState<CertificateData | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/dashboard/certificate/' + params.enrollmentId)
    }
  }, [status, router, params.enrollmentId])

  useEffect(() => {
    if (status === 'authenticated' && params.enrollmentId) {
      fetchCertificate()
    }
  }, [status, params.enrollmentId])

  const fetchCertificate = async () => {
    try {
      const res = await fetch(`/api/certificates/${params.enrollmentId}`)
      if (res.ok) {
        const data = await res.json()
        setCertificate(data.certificate)
      }
    } catch (error) {
      console.error('Error fetching certificate:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    setGenerating(true)
    const element = document.getElementById('certificate-content')
    if (!element) return

    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#1a1a2e'
      })
      
      const link = document.createElement('a')
      link.download = `certificate-${certificate?.course.title.replace(/\s+/g, '-').toLowerCase()}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (error) {
      console.error('Error generating certificate:', error)
    } finally {
      setGenerating(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!certificate) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-dark pt-20">
          <div className="max-w-4xl mx-auto px-4 py-20 text-center">
            <div className="text-6xl mb-6">🏆</div>
            <h1 className="font-sora font-bold text-3xl mb-4">Certificate Not Found</h1>
            <p className="text-gray-400 mb-8">Complete a course to earn your certificate</p>
            <Link href="/dashboard/courses" className="btn-primary inline-block">
              My Courses
            </Link>
          </div>
        </div>
      </>
    )
  }

  const completionDate = new Date(certificate.completedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-dark pt-20">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="flex items-center justify-between mb-8">
            <Link href="/dashboard/courses" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Courses</span>
            </Link>
            <div className="flex items-center gap-3">
              <button 
                onClick={handleDownload}
                disabled={generating}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-secondary rounded-lg font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Download
              </button>
            </div>
          </div>

          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-400/10 border border-green-400/30 rounded-full text-green-400 text-sm mb-4">
              <CheckCircle className="w-4 h-4" />
              Course Completed
            </div>
            <h1 className="font-sora font-bold text-4xl">Certificate of Completion</h1>
            <p className="text-gray-400 mt-2">Congratulations on completing this course!</p>
          </div>

          <div className="flex justify-center">
            <div 
              id="certificate-content"
              className="relative w-full max-w-4xl aspect-[1.4/1] bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#1a1a2e] rounded-xl overflow-hidden"
              style={{
                boxShadow: '0 0 60px rgba(139, 92, 246, 0.3), 0 0 120px rgba(59, 130, 246, 0.1)'
              }}
            >
              <div className="absolute inset-0 border-2 border-[#fbbf24]/30 rounded-xl m-4" />
              <div className="absolute inset-0 border border-[#fbbf24]/10 rounded-xl m-6" />

              <div className="absolute top-8 left-0 right-0 flex justify-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#fbbf24] to-[#f59e0b] flex items-center justify-center" style={{ boxShadow: '0 0 30px rgba(251, 191, 36, 0.5)' }}>
                  <Award className="w-10 h-10 text-dark" />
                </div>
              </div>

              <div className="absolute top-32 left-0 right-0 text-center">
                <p className="text-[#fbbf24] uppercase tracking-[0.3em] text-sm font-medium">Certificate of Completion</p>
                <h2 className="text-white font-sora font-bold text-3xl mt-3 px-8">
                  {certificate.user.name}
                </h2>
                <p className="text-gray-400 mt-4 text-sm">has successfully completed</p>
              </div>

              <div className="absolute top-[240px] left-0 right-0 text-center px-8">
                <div className="inline-block">
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-primary via-purple-400 to-secondary bg-clip-text text-transparent">
                    {certificate.course.title}
                  </h3>
                  <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mt-3" />
                </div>
                <p className="text-gray-400 mt-4 text-sm">
                  Instructed by <span className="text-white font-medium">{certificate.course.instructor.name}</span>
                </p>
              </div>

              <div className="absolute bottom-24 left-0 right-0 flex justify-center gap-16">
                <div className="text-center">
                  <p className="text-gray-500 text-xs uppercase tracking-wider">Date</p>
                  <p className="text-white font-medium mt-1">{completionDate}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-500 text-xs uppercase tracking-wider">Course Category</p>
                  <p className="text-white font-medium mt-1">{certificate.course.category}</p>
                </div>
              </div>

              <div className="absolute bottom-8 left-0 right-0 flex justify-center items-center gap-4">
                <div className="text-center">
                  <div className="w-32 h-px bg-[#fbbf24]/50" />
                  <p className="text-[#fbbf24] text-xs mt-2 font-sora">Raypanganiban</p>
                </div>
              </div>

              <div className="absolute top-8 right-8 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
                <span className="text-green-400 text-xs">Verified</span>
              </div>
            </div>
          </div>

          <div className="mt-10 text-center">
            <p className="text-gray-500 text-sm mb-4">Share your achievement</p>
            <div className="flex justify-center gap-4">
              <button className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg text-sm hover:border-primary transition-colors">
                <Share2 className="w-4 h-4" />
                Share
              </button>
              <Link 
                href={`/courses/${certificate.course.title.toLowerCase().replace(/\s+/g, '-')}`}
                className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg text-sm hover:border-primary transition-colors"
              >
                View Course
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
