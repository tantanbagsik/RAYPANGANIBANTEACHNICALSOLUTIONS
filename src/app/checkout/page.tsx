'use client'
import { useState, useEffect } from 'react'
import { useCart } from '@/context/CartContext'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Loader2, ArrowLeft, CreditCard, Lock, Check } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'

declare global {
  interface Window {
    paypal: any
  }
}

export default function CheckoutPage() {
  const { items, getTotal, clearCart } = useCart()
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [paypalLoaded, setPaypalLoaded] = useState(false)

  const total = getTotal()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/checkout')
    }
  }, [status, router])

  useEffect(() => {
    if (items.length === 0 && status === 'authenticated') {
      router.push('/courses')
    }
  }, [items, status, router])

  useEffect(() => {
    if (!total) return
    const script = document.createElement('script')
    script.src = `https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || 'sb'}&currency=USD`
    script.async = true
    script.onload = () => setPaypalLoaded(true)
    document.body.appendChild(script)
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [total])

  useEffect(() => {
    if (!paypalLoaded || !window.paypal || !total) return

    window.paypal.Buttons({
      style: { layout: 'vertical', color: 'blue', shape: 'rect', label: 'paypal' },
      createOrder: (data: any, actions: any) => {
        return actions.order.create({
          purchase_units: [{ amount: { value: total.toFixed(2) }, description: 'Course Enrollment' }]
        })
      },
      onApprove: async (data: any, actions: any) => {
        setProcessing(true)
        try {
          const order = await actions.order.capture()
          for (const item of items) {
            await fetch('/api/enrollments', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                courseId: item.courseId,
                paymentId: order.id,
                amount: item.discountPrice || item.price,
                status: 'active'
              })
            })
          }
          clearCart()
          toast.success('Payment successful! You are enrolled.')
          router.push('/dashboard/courses')
        } catch (error) {
          console.error('Payment error:', error)
          toast.error('Payment processing failed. Please contact support.')
        } finally {
          setProcessing(false)
        }
      },
      onError: (err: any) => {
        console.error('PayPal error:', err)
        toast.error('Payment failed. Please try again.')
        setProcessing(false)
      }
    }).render('#paypal-button-container')

    setLoading(false)
  }, [paypalLoaded, total, items, clearCart, router])

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (items.length === 0) return null

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-dark pt-20">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-8">
            <Link href="/cart" className="p-2 hover:bg-card rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-sora font-bold text-2xl">Checkout</h1>
              <p className="text-gray-400 text-sm">Complete your purchase</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <div className="glow-card p-6">
                <h2 className="font-sora font-semibold text-lg mb-4">Order Summary</h2>
                <div className="space-y-3 mb-6">
                  {items.map(item => (
                    <div key={item.courseId} className="flex items-center gap-3">
                      <div className="w-12 h-8 rounded bg-card flex items-center justify-center text-sm">📚</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{item.title}</p>
                        <p className="text-xs text-gray-500">by {item.instructor}</p>
                      </div>
                      <span className="text-sm font-medium">${item.discountPrice || item.price}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border pt-4">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span className="text-green-400">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="glow-card p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Lock className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-gray-400">Secure Checkout</span>
                </div>
                <h2 className="font-sora font-semibold text-lg mb-4">Pay with PayPal</h2>
                <div id="paypal-button-container" className="min-h-[200px]"></div>
                {processing && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-primary">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Processing payment...</span>
                  </div>
                )}
                <div className="mt-6 flex items-center justify-center gap-4 text-gray-500">
                  <div className="flex items-center gap-1 text-xs">
                    <Check className="w-3 h-3" /> SSL Secured
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <Check className="w-3 h-3" /> Money Back Guarantee
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}