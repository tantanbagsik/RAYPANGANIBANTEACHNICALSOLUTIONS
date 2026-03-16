import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import Course from '@/models/Course'
import Enrollment from '@/models/Enrollment'
import * as dns from 'dns'
dns.setServers(['1.1.1.1'])

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    const user = session?.user as any
    if (!session || user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const course = await Course.findById(params.id)
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Delete associated enrollments
    await Enrollment.deleteMany({ course: params.id })

    // Delete the course
    await Course.findByIdAndDelete(params.id)

    return NextResponse.json({ message: 'Course deleted successfully' })
  } catch (error) {
    console.error('[ADMIN COURSE DELETE]', error)
    return NextResponse.json({ error: 'Failed to delete course' }, { status: 500 })
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    const user = session?.user as any
    if (!session || user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const course = await Course.findById(params.id).populate('instructor', 'name email').lean()
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      course: { 
        ...course, 
        _id: course._id.toString(),
        instructor: course.instructor ? {
          _id: (course.instructor as any)._id?.toString(),
          name: (course.instructor as any).name,
          email: (course.instructor as any).email
        } : null
      } 
    })
  } catch (error) {
    console.error('[ADMIN COURSE GET]', error)
    return NextResponse.json({ error: 'Failed to fetch course' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    const user = session?.user as any
    if (!session || user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { title, slug, description, shortDescription, thumbnail, category, level, price, discountPrice, requirements, whatYouLearn, sections, isPublished } = body

    await connectDB()

    const course = await Course.findById(params.id)
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Check slug uniqueness if changed
    if (slug && slug !== course.slug) {
      const existing = await Course.findOne({ slug })
      if (existing) {
        return NextResponse.json({ error: 'Course with this slug already exists' }, { status: 409 })
      }
    }

    const totalLessons = sections?.reduce((acc: number, s: any) => acc + (s.lessons?.length || 0), 0) || course.totalLessons

    const updatedCourse = await Course.findByIdAndUpdate(params.id, {
      ...(title && { title }),
      ...(slug && { slug }),
      ...(description && { description }),
      ...(shortDescription && { shortDescription }),
      ...(thumbnail && { thumbnail }),
      ...(category && { category }),
      ...(level && { level }),
      ...(price !== undefined && { price }),
      ...(discountPrice !== undefined && { discountPrice }),
      ...(requirements && { requirements }),
      ...(whatYouLearn && { whatYouLearn }),
      ...(sections && { sections }),
      totalLessons,
      ...(isPublished !== undefined && { isPublished })
    }, { new: true }).populate('instructor', 'name email')

    return NextResponse.json({ 
      course: { 
        ...updatedCourse?.toObject(), 
        _id: updatedCourse?._id.toString() 
      } 
    })
  } catch (error) {
    console.error('[ADMIN COURSE PUT]', error)
    return NextResponse.json({ error: 'Failed to update course' }, { status: 500 })
  }
}