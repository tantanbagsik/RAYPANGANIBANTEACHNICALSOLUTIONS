import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { EnrollButton } from '@/components/courses/EnrollButton'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { notFound } from 'next/navigation'
import { connectDB } from '@/lib/mongodb'
import Course from '@/models/Course'
import Enrollment from '@/models/Enrollment'
import { Clock, BookOpen, BarChart3, Globe, CheckCircle, ChevronDown, Star, Users } from 'lucide-react'
import type { Metadata } from 'next'

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await connectDB()
  const course = await Course.findOne({ slug: params.slug }).lean() as any
  if (!course) return { title: 'Course Not Found' }
  return { title: course.title, description: course.shortDescription }
}

export default async function CourseDetailPage({ params }: Props) {
  const session = await getServerSession(authOptions)
  const user = session?.user as any

  await connectDB()
  const course = await Course.findOne({ slug: params.slug, isPublished: true })
    .populate('instructor', 'name image bio')
    .lean() as any

  if (!course) notFound()

  const isEnrolled = user
    ? !!(await Enrollment.findOne({ user: user.id, course: course._id, status: { $in: ['active', 'completed'] } }))
    : false

  const price = course.discountPrice ?? course.price
  const discount = course.discountPrice && course.price > course.discountPrice
    ? Math.round((1 - course.discountPrice / course.price) * 100)
    : 0
  const hours = Math.round(course.totalDuration / 60)

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-dark pt-16">
        {/* Hero */}
        <div className="bg-gradient-to-r from-dark via-card to-dark border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              {/* Left — course info */}
              <div className="lg:col-span-2">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="badge text-primary border-primary/30 bg-primary/10 text-xs">{course.category}</span>
                  <span className="badge text-secondary border-secondary/30 bg-secondary/10 text-xs">{course.level}</span>
                  {course.isFeatured && <span className="badge text-accent border-accent/30 bg-accent/10 text-xs">⭐ Featured</span>}
                </div>

                <h1 className="font-sora font-bold text-3xl sm:text-4xl mb-4 leading-tight">{course.title}</h1>
                <p className="text-gray-300 text-lg mb-6">{course.shortDescription}</p>

                {/* Rating row */}
                <div className="flex flex-wrap items-center gap-4 text-sm mb-6">
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} className={`w-4 h-4 ${s <= Math.round(course.rating) ? 'text-accent fill-accent' : 'text-gray-600'}`} />
                    ))}
                    <span className="text-accent font-semibold ml-1">{course.rating?.toFixed(1)}</span>
                    <span className="text-gray-500">({course.reviewCount?.toLocaleString()} reviews)</span>
                  </div>
                  <span className="flex items-center gap-1 text-gray-400">
                    <Users className="w-4 h-4" /> {course.enrollmentCount?.toLocaleString()} students
                  </span>
                  <span className="flex items-center gap-1 text-gray-400">
                    <Globe className="w-4 h-4" /> {course.language ?? 'English'}
                  </span>
                </div>

                {/* Instructor */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {course.instructor?.name?.[0]}
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">Created by </span>
                    <span className="text-primary text-sm font-medium">{course.instructor?.name}</span>
                  </div>
                </div>
              </div>

              {/* Right — purchase card (desktop) */}
              <div className="hidden lg:block">
                <PurchaseCard course={course} price={price} discount={discount} hours={hours} isEnrolled={isEnrolled} userId={user?.id} />
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-10">
              {/* What you'll learn */}
              {course.whatYouLearn?.length > 0 && (
                <div className="glow-card p-6">
                  <h2 className="font-sora font-bold text-xl mb-5">What you'll learn</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {course.whatYouLearn.map((item: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-gray-300">
                        <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Requirements */}
              {course.requirements?.length > 0 && (
                <div>
                  <h2 className="font-sora font-bold text-xl mb-4">Requirements</h2>
                  <ul className="space-y-2">
                    {course.requirements.map((r: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                        <span className="text-primary mt-1">•</span> {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Curriculum */}
              {course.sections?.length > 0 && (
                <div>
                  <h2 className="font-sora font-bold text-xl mb-5">Course Curriculum</h2>
                  <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                    <span>{course.sections.length} sections</span>
                    <span>•</span>
                    <span>{course.totalLessons} lessons</span>
                    <span>•</span>
                    <span>{hours}h total</span>
                  </div>
                  <div className="space-y-3">
                    {course.sections.map((section: any, si: number) => (
                      <details key={si} className="glow-card overflow-hidden group" open={si === 0}>
                        <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
                          <div className="flex items-center gap-3">
                            <ChevronDown className="w-4 h-4 text-gray-400 group-open:rotate-180 transition-transform" />
                            <span className="font-medium text-sm">{section.title}</span>
                          </div>
                          <span className="text-xs text-gray-500">{section.lessons?.length} lessons</span>
                        </summary>
                        <div className="border-t border-border">
                          {section.lessons?.map((lesson: any, li: number) => (
                            <div key={li} className="flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                                  lesson.isFree ? 'bg-green-400/20 text-green-400' : 'bg-gray-700 text-gray-500'
                                }`}>
                                  {lesson.isFree ? '▶' : '🔒'}
                                </div>
                                <span className="text-sm text-gray-300">{lesson.title}</span>
                                {lesson.isFree && (
                                  <span className="badge text-green-400 border-green-400/30 bg-green-400/10 text-xs">Preview</span>
                                )}
                              </div>
                              <span className="text-xs text-gray-500">{lesson.duration}min</span>
                            </div>
                          ))}
                        </div>
                      </details>
                    ))}
                  </div>
                </div>
              )}

              {/* Instructor bio */}
              {course.instructor?.bio && (
                <div>
                  <h2 className="font-sora font-bold text-xl mb-4">About the Instructor</h2>
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center font-bold text-xl flex-shrink-0">
                      {course.instructor.name?.[0]}
                    </div>
                    <div>
                      <h3 className="font-sora font-semibold text-lg">{course.instructor.name}</h3>
                      <p className="text-gray-400 text-sm mt-2 leading-relaxed">{course.instructor.bio}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile purchase card */}
            <div className="lg:hidden">
              <PurchaseCard course={course} price={price} discount={discount} hours={hours} isEnrolled={isEnrolled} userId={user?.id} />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}

function PurchaseCard({ course, price, discount, hours, isEnrolled, userId }: any) {
  return (
    <div className="glow-card p-6 sticky top-24">
      {/* Thumbnail */}
      <div className="h-48 rounded-xl overflow-hidden mb-5 bg-gradient-to-br from-primary/30 to-secondary/20 flex items-center justify-center">
        {course.thumbnail ? (
          <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
        ) : (
          <span className="text-5xl">📚</span>
        )}
      </div>

      {/* Price */}
      <div className="flex items-end gap-3 mb-2">
        {price === 0 ? (
          <span className="font-sora font-bold text-4xl text-green-400">Free</span>
        ) : (
          <>
            <span className="font-sora font-bold text-4xl">${price}</span>
            {discount > 0 && (
              <>
                <span className="text-gray-500 line-through text-lg">${course.price}</span>
                <span className="badge text-red-400 border-red-400/30 bg-red-400/10 text-xs">{discount}% OFF</span>
              </>
            )}
          </>
        )}
      </div>

      {discount > 0 && (
        <p className="text-orange-400 text-xs mb-4 font-medium">⏰ Limited time offer!</p>
      )}

      <EnrollButton
        courseId={course._id.toString()}
        courseSlug={course.slug}
        title={course.title}
        thumbnail={course.thumbnail}
        price={price}
        discountPrice={course.discountPrice}
        instructorName={(course.instructor as any)?.name || 'Instructor'}
        isEnrolled={isEnrolled}
        isLoggedIn={!!userId}
      />

      <p className="text-center text-gray-500 text-xs mt-3">30-day money-back guarantee</p>

      {/* Course includes */}
      <div className="mt-6 space-y-3">
        <p className="font-semibold text-sm">This course includes:</p>
        {[
          { icon: BookOpen, text: `${course.totalLessons} lessons` },
          { icon: Clock, text: `${hours} hours of content` },
          { icon: BarChart3, text: `${course.level} level` },
          { icon: Globe, text: 'Full lifetime access' },
          { icon: CheckCircle, text: 'Certificate of completion' },
        ].map(({ icon: Icon, text }, i) => (
          <div key={i} className="flex items-center gap-2 text-sm text-gray-400">
            <Icon className="w-4 h-4 text-gray-500" /> {text}
          </div>
        ))}
      </div>

      {/* Tags */}
      {course.tags?.length > 0 && (
        <div className="mt-5 pt-5 border-t border-border">
          <p className="text-xs text-gray-500 mb-2">Tags:</p>
          <div className="flex flex-wrap gap-1.5">
            {course.tags.map((tag: string) => (
              <span key={tag} className="badge text-gray-400 border-border bg-border/50 text-xs">{tag}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
