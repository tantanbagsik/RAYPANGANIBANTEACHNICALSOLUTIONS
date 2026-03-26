import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { connectDB } from '@/lib/mongodb'
import Enrollment from '@/models/Enrollment'
import User from '@/models/User'
import { Navbar } from '@/components/layout/Navbar'
import Link from 'next/link'
import { BookOpen, Clock, Trophy, TrendingUp, ChevronRight, Award, Zap, MessageSquare } from 'lucide-react'

export const metadata = {
  title: 'Dashboard | E-Learning Platform',
  description: 'Track your learning progress, courses, certificates, and achievements in our interactive dashboard',
  keywords: 'learning dashboard, course progress, learning analytics, education platform'
}

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  "name": "Your E-Learning Platform",
  "url": "https://your-platform.com",
  "description": "Learn new skills with our extensive course library",
  "sameAs": ["https://twitter.com/yourplatform", "https://facebook.com/yourplatform"]
};
  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "EducationalOccupationalProgram",
    "name": "Student Dashboard",
    "description": "Track your learning progress, courses, certificates, and achievements in our interactive dashboard",
    "inLanguage": "en",
    "learningResourceType": "Mixed Media"
  };
  
  const userProgressSchema = {
    "@context": "https://schema.org",
    "@type": "Learner",
    "name": user.name,
    "pointsBalance": userPoints,
    "learningProgress": stats.avgProgress,
    "numberOfAchievements": stats.completed,
    "inLanguage": "en"
  };

  const courseSchema = {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": enrollments.map(e => e.course?.title).join(", "),
    "provider": {
      "@type": "EducationalOrganization",
      "name": "Your E-Learning Platform"
    }
  };



export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/auth/login?callbackUrl=/dashboard')

  const user = session.user as any
  await connectDB()

  const userData = await User.findById(user.id).select('points').lean()
  const userPoints = userData?.points || 0

  const enrollments = await Enrollment.find({ user: user.id, status: { $in: ['active', 'completed'] } })
    .populate({ path: 'course', select: 'title slug thumbnail category level totalLessons', populate: { path: 'instructor', select: 'name' } })
    .sort({ lastAccessedAt: -1 })
    .limit(10)
    .lean()

  const stats = {
    enrolled: enrollments.length,
    completed: enrollments.filter((e: any) => e.status === 'completed').length,
    inProgress: enrollments.filter((e: any) => e.status === 'active' && e.progress > 0).length,
    avgProgress: enrollments.length
      ? Math.round(enrollments.reduce((s: number, e: any) => s + e.progress, 0) / enrollments.length)
      : 0,
  }

return (
  <>
  <main role="region" aria-labelledby="dashboard-main-heading">
    <h1 id="dashboard-main-heading" className="visually-hidden">Dashboard Page</h1>
      <Navbar />
      <div className="min-h-screen bg-dark pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Header */}
          <div className="mb-10">
            <h1 className="font-sora font-bold text-3xl sm:text-4xl mb-1">
              Welcome back, <span className="gradient-text">{user.name?.split(' ')[0]}</span> 👋
            </h1>
            <p className="text-gray-400">Here's what's happening with your learning.</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
            {[
              { icon: BookOpen, label: 'Enrolled', value: stats.enrolled, color: 'text-primary', bg: 'bg-primary/10' },
              { icon: TrendingUp, label: 'In Progress', value: stats.inProgress, color: 'text-secondary', bg: 'bg-secondary/10' },
              { icon: Trophy, label: 'Completed', value: stats.completed, color: 'text-accent', bg: 'bg-accent/10' },
              { icon: Clock, label: 'Avg. Progress', value: `${stats.avgProgress}%`, color: 'text-green-400', bg: 'bg-green-400/10' },
              { icon: Zap, label: 'My Points', value: userPoints.toLocaleString(), color: 'text-yellow-400', bg: 'bg-yellow-400/10', link: '/topup' },
            ].map((s, i) => (
              <Link key={i} href={s.link || '#'} className={`glow-card p-5 ${s.link ? 'hover:border-yellow-400/50 transition-colors' : ''}`}>
                <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <div className="font-sora font-bold text-2xl">{s.value}</div>
                <div className="text-gray-500 text-sm">{s.label}</div>
              </Link>
            ))}
          </div>

          {/* Continue Learning */}
          <div className="mb-10" itemscope itemtype="https://schema.org/ItemList">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-sora font-bold text-xl" itemprop="name">Continue Learning</h2>
              <Link href="/dashboard/courses" className="text-primary text-sm hover:underline flex items-center gap-1">
                View all <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {enrollments.length === 0 ? (
              <div className="glow-card p-12 text-center">
                <div className="text-5xl mb-4">📚</div>
                <h3 className="font-sora font-semibold text-lg mb-2">No courses yet</h3>
                <p className="text-gray-400 text-sm mb-6">Start your learning journey today!</p>
                <Link href="/courses" className="btn-primary inline-block">Browse Courses</Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {enrollments.slice(0, 6).map((e: any) => (
                  <Link key={e._id} href={`/dashboard/courses/${e.course?.slug}`} className="glow-card overflow-hidden group">
                    <div className="h-36 bg-gradient-to-br from-primary/30 to-secondary/20 flex items-center justify-center">
                      <span className="text-4xl" aria-label="Course Content">📖</span>
                    </div>
                    <div className="p-4">
                      <span className="badge text-primary border-primary/30 bg-primary/10 text-xs mb-2 inline-flex">{e.course?.category}</span>
                      <h3 className="font-sora font-semibold text-sm mb-1 group-hover:text-primary transition-colors line-clamp-2">{e.course?.title}</h3>
                      <p className="text-gray-500 text-xs mb-3">By {e.course?.instructor?.name}</p>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-400">{e.progress}% complete</span>
                        {e.status === 'completed' && <span className="text-xs text-green-400 font-medium">✓ Done</span>}
                      </div>
                      <div className="h-1.5 bg-border rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all"
                          style={{ width: `${e.progress}%` }} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

           {/* Quick actions */}
           <div className="glow-card p-6">
             <h2 className="font-sora font-bold text-lg mb-4">Quick Actions</h2>
             <div className="flex flex-wrap gap-3">
               <Link href="/courses" className="btn-outline text-sm">Browse Courses</Link>
               <Link href="/dashboard/certificates" className="btn-outline text-sm">My Certificates</Link>
               <Link href="/topup" className="btn-outline text-sm text-yellow-400 border-yellow-400/30 hover:border-yellow-400">Top Up Points</Link>
               <Link href="/dashboard/settings" className="btn-outline text-sm">Account Settings</Link>
             </div>
           </div>

           {/* Recent Support Chats */}
           <div className="mt-10">
             <h2 className="font-sora font-bold text-lg mb-4 flex items-center gap-2">
               <MessageSquare className="w-5 h-5 text-primary" />
               Recent Support
             </h2>
             <div id="recent-chats-loading" className="text-center py-8">
               <div className="animate-spin rounded-full w-8 h-8 border-b-2 border-primary mx-auto mb-4"></div>
               <p className="text-gray-400">Loading your chats...</p>
             </div>
              <div id="recent-chats-content" className="space-y-4 hidden">
                {/* Chats will be inserted here by JavaScript */}
              </div>
           </div>
        </div>
      </div>
    </>
  )
}
