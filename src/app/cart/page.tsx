'use client'
import { useCart } from '@/context/CartContext'
import Link from 'next/link'
import { Trash2, ShoppingBag, ArrowLeft, CreditCard } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'

export default function CartPage() {
  const { items, removeItem, getTotal, clearCart } = useCart()
  const total = getTotal()

  if (items.length === 0) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-dark pt-20">
          <div className="max-w-2xl mx-auto px-4 py-16 text-center">
            <div className="w-20 h-20 bg-card rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-10 h-10 text-gray-500" />
            </div>
            <h1 className="font-sora font-bold text-2xl mb-3">Your cart is empty</h1>
            <p className="text-gray-400 mb-8">Browse our courses and add some to your cart!</p>
            <Link href="/courses" className="btn-primary inline-flex">
              Browse Courses
            </Link>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-dark pt-20">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-8">
            <Link href="/courses" className="p-2 hover:bg-card rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-sora font-bold text-2xl">Shopping Cart</h1>
              <p className="text-gray-400 text-sm">{items.length} course{items.length !== 1 ? 's' : ''} in cart</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {items.map(item => (
                <div key={item.courseId} className="glow-card p-4 flex gap-4">
                  <div className="w-24 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-card">
                    {item.thumbnail ? (
                      <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">📚</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm mb-1 truncate">{item.title}</h3>
                    <p className="text-gray-500 text-xs mb-2">by {item.instructor}</p>
                    <div className="flex items-center gap-2">
                      {item.discountPrice ? (
                        <>
                          <span className="text-green-400 font-semibold">${item.discountPrice}</span>
                          <span className="text-gray-500 line-through text-xs">${item.price}</span>
                        </>
                      ) : (
                        <span className="text-green-400 font-semibold">${item.price}</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(item.courseId)}
                    className="p-2 hover:bg-card rounded-lg text-gray-400 hover:text-red-400 transition-colors self-start"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button onClick={clearCart} className="text-sm text-gray-500 hover:text-red-400">
                Clear all items
              </button>
            </div>

            <div className="lg:col-span-1">
              <div className="glow-card p-6 sticky top-24">
                <h2 className="font-sora font-semibold text-lg mb-4">Order Summary</h2>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Subtotal</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Discount</span>
                    <span className="text-green-400">-$0.00</span>
                  </div>
                </div>
                <div className="border-t border-border pt-4 mb-6">
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span className="text-xl">${total.toFixed(2)}</span>
                  </div>
                </div>
                <Link href="/checkout" className="btn-primary w-full flex items-center justify-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Checkout with PayPal
                </Link>
                <p className="text-xs text-gray-500 text-center mt-4">
                  Secure payment powered by PayPal
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}