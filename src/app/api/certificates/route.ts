import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import Enrollment from '@/models/Enrollment'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = session.user as any

    await connectDB()

    const enrollments = await Enrollment.find({
      user: user.id,
      $or: [
        { status: 'completed' },
        { progress: { $gte: 100 } }
      ]
    })
      .populate({
        path: 'course',
        select: 'title slug thumbnail category instructor',
        populate: { path: 'instructor', select: 'name' }
      })
      .sort({ completedAt: -1, updatedAt: -1 })
      .lean()

    const certificates = enrollments.map((e: any) => ({
      _id: e._id,
      course: {
        title: e.course?.title,
        slug: e.course?.slug,
        thumbnail: e.course?.thumbnail,
        category: e.course?.category,
        instructor: e.course?.instructor
      },
      completedAt: e.completedAt || e.updatedAt
    }))

    return NextResponse.json({ certificates })
  } catch (error) {
    console.error('[CERTIFICATES GET]', error)
    return NextResponse.json({ error: 'Failed to fetch certificates' }, { status: 500 })
  }
}
