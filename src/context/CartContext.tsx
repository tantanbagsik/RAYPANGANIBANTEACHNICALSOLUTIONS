'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface CartItem {
  id: string
  courseId: string
  title: string
  thumbnail: string
  price: number
  discountPrice?: number
  instructor: string
  slug: string
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (courseId: string) => void
  clearCart: () => void
  getTotal: () => number
  getItemCount: () => number
  isInCart: (courseId: string) => boolean
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  useEffect(() => {
    const saved = localStorage.getItem('cart')
    if (saved) {
      try {
        setItems(JSON.parse(saved))
      } catch {
        localStorage.removeItem('cart')
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items))
  }, [items])

  function addItem(item: CartItem) {
    if (!items.some(i => i.courseId === item.courseId)) {
      setItems(prev => [...prev, item])
    }
  }

  function removeItem(courseId: string) {
    setItems(prev => prev.filter(i => i.courseId !== courseId))
  }

  function clearCart() {
    setItems([])
  }

  function getTotal() {
    return items.reduce((sum, item) => sum + (item.discountPrice || item.price), 0)
  }

  function getItemCount() {
    return items.length
  }

  function isInCart(courseId: string) {
    return items.some(i => i.courseId === courseId)
  }

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, clearCart, getTotal, getItemCount, isInCart }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used within CartProvider')
  return context
}