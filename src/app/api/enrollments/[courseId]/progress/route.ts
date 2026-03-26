import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import Enrollment from '@/models/Enrollment'
import Course from '@/models/Course'

// POST /api/enrollments/[courseId]/progress
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = session.user as any

    const { lessonId, watchedSeconds, completed } = await req.json()

    await connectDB()

    const enrollment = await Enrollment.findOne({ user: user.id, course: courseId })
    if (!enrollment) return NextResponse.json({ error: 'Not enrolled' }, { status: 403 })

    // Update or add lesson progress
    const existingIdx = enrollment.lessonsProgress.findIndex(
      (lp: any) => lp.lessonId === lessonId
    )

    if (existingIdx >= 0) {
      enrollment.lessonsProgress[existingIdx].watchedSeconds = Math.max(
        enrollment.lessonsProgress[existingIdx].watchedSeconds,
        watchedSeconds
      )
      if (completed && !enrollment.lessonsProgress[existingIdx].completedAt) {
        enrollment.lessonsProgress[existingIdx].completedAt = new Date()
      }
    } else {
      enrollment.lessonsProgress.push({
        lessonId,
        watchedSeconds,
        completedAt: completed ? new Date() : null,
      })
    }

    // Recalculate overall progress
    const course = await Course.findById(courseId).lean() as any
    if (course && course.totalLessons > 0) {
      const completedCount = enrollment.lessonsProgress.filter(
        (lp: any) => lp.completedAt
      ).length
      enrollment.progress = Math.round((completedCount / course.totalLessons) * 100)

      if (enrollment.progress === 100 && !enrollment.completedAt) {
        enrollment.completedAt = new Date()
        enrollment.status = 'completed'
      }
    }

    enrollment.lastAccessedAt = new Date()
    await enrollment.save()

    return NextResponse.json({ progress: enrollment.progress, enrollment })
  } catch (error) {
    console.error('[PROGRESS UPDATE]', error)
    return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 })
  }
}
