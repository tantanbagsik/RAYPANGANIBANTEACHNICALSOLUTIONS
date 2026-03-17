import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import Enrollment from '@/models/Enrollment'
import User from '@/models/User'

export async function GET(req: NextRequest, { params }: { params: { enrollmentId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = session.user as any

    await connectDB()

    const enrollment = await Enrollment.findById(params.enrollmentId)
      .populate({
        path: 'course',
        select: 'title category instructor',
        populate: { path: 'instructor', select: 'name' }
      })
      .populate({
        path: 'user',
        select: 'name'
      })
      .lean()

    if (!enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })
    }

    if ((enrollment.user as any)._id.toString() !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (enrollment.status !== 'completed' && enrollment.progress < 100) {
      return NextResponse.json({ error: 'Course not completed yet' }, { status: 400 })
    }

    return NextResponse.json({
      certificate: {
        _id: enrollment._id,
        course: {
          title: (enrollment.course as any).title,
          category: (enrollment.course as any).category,
          instructor: (enrollment.course as any).instructor
        },
        user: {
          name: (enrollment.user as any).name
        },
        completedAt: enrollment.completedAt || enrollment.updatedAt
      }
    })
  } catch (error) {
    console.error('[CERTIFICATE GET]', error)
    return NextResponse.json({ error: 'Failed to fetch certificate' }, { status: 500 })
  }
}
