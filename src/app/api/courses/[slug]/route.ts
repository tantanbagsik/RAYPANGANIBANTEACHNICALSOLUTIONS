import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import Course from '@/models/Course'
import Enrollment from '@/models/Enrollment'
import { Review } from '@/models/Review'

// GET /api/courses/[slug]
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  try {
    await connectDB()
    const session = await getServerSession(authOptions)

    const course = await Course.findOne({ slug: slug })
      .populate('instructor', 'name image bio')
      .lean()

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Check if the user is enrolled
    let isEnrolled = false
    let enrollment = null
    if (session?.user) {
      const user = session.user as any
      enrollment = await Enrollment.findOne({ user: user.id, course: (course as any)._id }).lean()
      isEnrolled = !!enrollment
    }

    // Get reviews
    const reviews = await Review.find({ course: (course as any)._id })
      .populate('user', 'name image')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean()

    // Strip paid content if not enrolled
    const sanitizedCourse = { ...course } as any
    if (!isEnrolled) {
      sanitizedCourse.sections = sanitizedCourse.sections?.map((section: any) => ({
        ...section,
        lessons: section.lessons.map((lesson: any) => ({
          ...lesson,
          videoUrl: lesson.isFree ? lesson.videoUrl : undefined,
        })),
      }))
    }

    return NextResponse.json({ course: sanitizedCourse, isEnrolled, enrollment, reviews })
  } catch (error) {
    console.error('[COURSE GET]', error)
    return NextResponse.json({ error: 'Failed to fetch course' }, { status: 500 })
  }
}

// PATCH /api/courses/[slug] — update course
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = session.user as any

    await connectDB()
    const course = await Course.findOne({ slug: slug })
    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

    const isOwner = course.instructor.toString() === user.id
    if (!isOwner && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    Object.assign(course, body)
    await course.save()

    return NextResponse.json({ course })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update course' }, { status: 500 })
  }
}

// DELETE /api/courses/[slug]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = session.user as any

    await connectDB()
    const course = await Course.findOne({ slug: slug })
    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

    if (course.instructor.toString() !== user.id && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await course.deleteOne()
    return NextResponse.json({ message: 'Course deleted' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete course' }, { status: 500 })
  }
}
