'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'
import { Loader2, ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import { useCart } from '@/context/CartContext'

interface Props {
  courseId: string
  courseSlug: string
  title: string
  thumbnail: string
  price: number
  discountPrice?: number
  instructorName: string
  isEnrolled: boolean
  isLoggedIn: boolean
}

export function EnrollButton({ courseId, courseSlug, title, thumbnail, price, discountPrice, instructorName, isEnrolled, isLoggedIn }: Props) {
  const router = useRouter()
  const { addItem, isInCart } = useCart()
  const [loading, setLoading] = useState(false)

  const currentPrice = discountPrice || price
  const effectivePrice = currentPrice === 0 ? 0 : currentPrice
  const inCart = isInCart(courseId)

  if (isEnrolled) {
    return (
      <Link href={`/dashboard/courses/${courseSlug}`} className="btn-primary w-full text-center block py-4 text-base">
        ▶ Continue Learning
      </Link>
    )
  }

  if (!isLoggedIn) {
    return (
      <Link href={`/auth/login?callbackUrl=/courses/${courseSlug}`} className="btn-primary w-full text-center block py-4 text-base">
        {effectivePrice === 0 ? 'Enroll for Free' : `Enroll for $${effectivePrice}`}
      </Link>
    )
  }

  async function handleFreeEnroll() {
    setLoading(true)
    try {
      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error ?? 'Enrollment failed')
        return
      }

      toast.success('Enrolled successfully!')
      router.push(data.url)
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleAddToCart() {
    addItem({
      id: Date.now().toString(),
      courseId,
      title,
      thumbnail,
      price,
      discountPrice,
      instructor: instructorName,
      slug: courseSlug
    })
    toast.success('Added to cart!')
    router.push('/cart')
  }

  if (effectivePrice === 0) {
    return (
      <button
        onClick={handleFreeEnroll}
        disabled={loading}
        className="shimmer-btn w-full text-white font-bold py-4 rounded-xl text-base flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {loading ? (
          <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
        ) : (
          'Enroll for Free'
        )}
      </button>
    )
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleAddToCart}
        disabled={loading}
        className="shimmer-btn w-full text-white font-bold py-4 rounded-xl text-base flex items-center justify-center gap-2 disabled:opacity-60"
      >
        <ShoppingCart className="w-5 h-5" />
        Add to Cart - ${effectivePrice}
      </button>
      {inCart && (
        <Link href="/cart" className="btn-outline w-full text-center block py-3 text-sm">
          View Cart
        </Link>
      )}
    </div>
  )
}