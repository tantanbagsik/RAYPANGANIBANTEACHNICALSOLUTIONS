'use client'
import { useState, useEffect, useRef } from 'react'
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
  const canvasRef = useRef<HTMLCanvasElement>(null)

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

  useEffect(() => {
    if (certificate && canvasRef.current) {
      drawCertificate()
    }
  }, [certificate])

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

  const drawCertificate = () => {
    const canvas = canvasRef.current
    if (!canvas || !certificate) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = 1200
    const height = 850
    canvas.width = width
    canvas.height = height

    const gradient = ctx.createLinearGradient(0, 0, width, height)
    gradient.addColorStop(0, '#1a1a2e')
    gradient.addColorStop(0.5, '#16213e')
    gradient.addColorStop(1, '#1a1a2e')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    ctx.strokeStyle = 'rgba(251, 191, 36, 0.3)'
    ctx.lineWidth = 3
    ctx.strokeRect(30, 30, width - 60, height - 60)

    ctx.strokeStyle = 'rgba(251, 191, 36, 0.15)'
    ctx.lineWidth = 1
    ctx.strokeRect(50, 50, width - 100, height - 100)

    ctx.fillStyle = '#fbbf24'
    ctx.beginPath()
    ctx.arc(width / 2, 100, 40, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#1a1a2e'
    ctx.font = 'bold 40px serif'
    ctx.textAlign = 'center'
    ctx.fillText('★', width / 2, 115)

    ctx.fillStyle = '#fbbf24'
    ctx.font = '16px sans-serif'
    ctx.letterSpacing = '5px'
    ctx.fillText('CERTIFICATE OF COMPLETION'.toUpperCase(), width / 2, 200)

    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 48px serif'
    ctx.fillText(certificate.user.name, width / 2, 300)

    ctx.fillStyle = '#9ca3af'
    ctx.font = '18px sans-serif'
    ctx.fillText('has successfully completed', width / 2, 360)

    const titleFont = certificate.course.title.length > 40 ? 'bold 28px serif' : 'bold 36px serif'
    ctx.fillStyle = '#a78bfa'
    ctx.font = titleFont
    ctx.fillText(certificate.course.title, width / 2, 430)

    ctx.strokeStyle = '#8b5cf6'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(400, 460)
    ctx.lineTo(800, 460)
    ctx.stroke()

    ctx.fillStyle = '#9ca3af'
    ctx.font = '16px sans-serif'
    ctx.fillText(`Instructed by ${certificate.course.instructor.name}`, width / 2, 510)

    const completionDate = new Date(certificate.completedAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    ctx.fillStyle = '#9ca3af'
    ctx.font = '14px sans-serif'
    ctx.fillText('Date', width / 2 - 150, 650)
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 16px sans-serif'
    ctx.fillText(completionDate, width / 2 - 150, 680)

    ctx.fillStyle = '#9ca3af'
    ctx.font = '14px sans-serif'
    ctx.fillText('Category', width / 2 + 150, 650)
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 16px sans-serif'
    ctx.fillText(certificate.course.category, width / 2 + 150, 680)

    ctx.fillStyle = '#fbbf24'
    ctx.font = 'bold 20px serif'
    ctx.fillText('Raypanganiban', width / 2, 780)

    ctx.beginPath()
    ctx.moveTo(width / 2 - 100, 760)
    ctx.lineTo(width / 2 + 100, 760)
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)'
    ctx.lineWidth = 1
    ctx.stroke()

    ctx.fillStyle = '#22c55e'
    ctx.font = '12px sans-serif'
    ctx.fillText('● Verified', width - 100, 60)
  }

  const handleDownload = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const link = document.createElement('a')
    link.download = `certificate-${certificate?.course.title.replace(/\s+/g, '-').toLowerCase()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
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
            <button 
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-secondary rounded-lg font-medium text-sm hover:opacity-90 transition-opacity"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
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
            <canvas 
              ref={canvasRef} 
              className="w-full max-w-4xl aspect-[1.4/1] rounded-xl"
              style={{ boxShadow: '0 0 60px rgba(139, 92, 246, 0.3), 0 0 120px rgba(59, 130, 246, 0.1)' }}
            />
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
