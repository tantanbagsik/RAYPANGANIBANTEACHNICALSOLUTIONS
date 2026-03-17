import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { connectDB } from '@/lib/mongodb'
import Enrollment from '@/models/Enrollment'
import { Navbar } from '@/components/layout/Navbar'
import Link from 'next/link'
import { ChevronLeft, Trophy, Award } from 'lucide-react'

export const metadata = { title: 'My Courses' }

export default async function MyCoursesPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/auth/login')
  const user = session.user as any

  await connectDB()
  const enrollments = await Enrollment.find({ user: user.id })
    .populate({
      path: 'course',
      select: 'title slug thumbnail category level totalLessons totalDuration instructor rating',
      populate: { path: 'instructor', select: 'name' },
    })
    .sort({ lastAccessedAt: -1 })
    .lean()

  const active = enrollments.filter((e: any) => e.status === 'active')
  const completed = enrollments.filter((e: any) => e.status === 'completed')

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-dark pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center gap-4 mb-8">
            <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-sora font-bold text-3xl">My Courses</h1>
              <p className="text-gray-400 text-sm">{enrollments.length} total enrollments</p>
            </div>
          </div>

          {/* In Progress */}
          {active.length > 0 && (
            <section className="mb-12">
              <h2 className="font-sora font-semibold text-xl mb-5 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                In Progress ({active.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {active.map((e: any) => <EnrollmentCard key={e._id} enrollment={e} />)}
              </div>
            </section>
          )}

          {/* Completed */}
          {completed.length > 0 && (
            <section>
              <h2 className="font-sora font-semibold text-xl mb-5 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-accent" />
                Completed ({completed.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {completed.map((e: any) => <EnrollmentCard key={e._id} enrollment={e} />)}
              </div>
            </section>
          )}

          {enrollments.length === 0 && (
            <div className="text-center py-24">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="font-sora font-semibold text-xl mb-2">No courses yet</h3>
              <p className="text-gray-400 mb-6">Enroll in your first course to start learning</p>
              <Link href="/courses" className="btn-primary inline-block">Browse Courses</Link>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function EnrollmentCard({ enrollment }: { enrollment: any }) {
  const course = enrollment.course
  if (!course) return null
  const hours = Math.round((course.totalDuration ?? 0) / 60)
  const isCompleted = enrollment.status === 'completed' || enrollment.progress >= 100

  return (
    <div className="glow-card overflow-hidden group">
      <Link href={`/dashboard/courses/${course.slug}`}>
        <div className="h-40 bg-gradient-to-br from-primary/20 to-secondary/10 relative overflow-hidden flex items-center justify-center">
          {course.thumbnail ? (
            <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <span className="text-4xl">📖</span>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          {isCompleted && (
            <div className="absolute top-2 right-2 bg-green-400/90 text-dark text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1">
              <Trophy className="w-3 h-3" /> Done
            </div>
          )}
        </div>
        <div className="p-4">
          <span className="badge text-primary border-primary/30 bg-primary/10 text-xs mb-2 inline-flex">{course.category}</span>
          <h3 className="font-sora font-semibold text-sm mb-1 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
            {course.title}
          </h3>
          <p className="text-gray-500 text-xs mb-3">By {course.instructor?.name} • {hours > 0 ? `${hours}h` : `${course.totalLessons} lessons`}</p>

          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-gray-400">{enrollment.progress}% complete</span>
            <span className="text-xs text-gray-500">
              {enrollment.lessonsProgress?.filter((lp: any) => lp.completedAt).length ?? 0}/{course.totalLessons} lessons
            </span>
          </div>
          <div className="h-1.5 bg-border rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${isCompleted ? 'bg-green-400' : 'bg-gradient-to-r from-primary to-secondary'}`}
              style={{ width: `${enrollment.progress}%` }}
            />
          </div>

          {enrollment.lastAccessedAt && (
            <p className="text-xs text-gray-600 mt-2">
              Last visited {new Date(enrollment.lastAccessedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </p>
          )}
        </div>
      </Link>
      {isCompleted && (
        <div className="px-4 pb-4">
          <Link 
            href={`/dashboard/certificate/${enrollment._id}`}
            className="flex items-center justify-center gap-2 w-full py-2 bg-gradient-to-r from-[#fbbf24]/20 to-[#f59e0b]/20 border border-[#fbbf24]/30 rounded-lg text-[#fbbf24] text-sm font-medium hover:from-[#fbbf24]/30 hover:to-[#f59e0b]/30 transition-all"
          >
            <Award className="w-4 h-4" />
            Get Certificate
          </Link>
        </div>
      )}
    </div>
  )
}
