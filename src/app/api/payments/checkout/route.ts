import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import Stripe from 'stripe'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import Course from '@/models/Course'
import Enrollment from '@/models/Enrollment'
import { Payment } from '@/models/Review'
import * as dns from 'dns'
dns.setServers(['1.1.1.1'])

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = session.user as any

    const { courseId } = await req.json()
    if (!courseId) return NextResponse.json({ error: 'Course ID required' }, { status: 400 })

    await connectDB()

    const course = await Course.findById(courseId).populate('instructor', 'name')
    if (!course || !course.isPublished) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Check if already enrolled
    const existing = await Enrollment.findOne({ user: user.id, course: courseId })
    if (existing) {
      return NextResponse.json({ error: 'Already enrolled in this course' }, { status: 409 })
    }

    // Free course — enroll directly without Stripe
    if (course.price === 0 || course.discountPrice === 0) {
      await Enrollment.create({ 
        user: user.id, 
        course: courseId, 
        amountPaid: 0,
        currency: course.currency || 'usd',
        status: 'active',
        progress: 0,
        lastAccessedAt: new Date()
      })
      await Course.findByIdAndUpdate(courseId, { $inc: { enrollmentCount: 1 } })
      return NextResponse.json({ 
        url: `/dashboard/courses/${course.slug}`,
        message: 'Enrolled successfully!'
      })
    }

    // Paid course — check for Stripe key
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Payment system not configured' }, { status: 503 })
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-04-10' })
    const price = course.discountPrice ?? course.price

    // Create Stripe session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: user.email!,
      metadata: { userId: user.id, courseId: courseId.toString() },
      line_items: [
        {
          price_data: {
            currency: course.currency ?? 'usd',
            unit_amount: Math.round(price * 100),
            product_data: {
              name: course.title,
              description: course.shortDescription,
              images: [course.thumbnail],
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/courses/${course.slug}`,
    })

    // Store pending payment
    await Payment.create({
      user: user.id,
      course: courseId,
      stripeSessionId: checkoutSession.id,
      amount: price,
      currency: course.currency ?? 'usd',
      status: 'pending',
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error('[CHECKOUT ERROR]', error)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}