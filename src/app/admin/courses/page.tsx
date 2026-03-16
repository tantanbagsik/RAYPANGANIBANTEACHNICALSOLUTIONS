'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { 
  Plus, Search, Edit, Trash2, Eye, 
  BookOpen, Users, DollarSign, MoreVertical,
  ChevronLeft, ChevronRight, Loader2, X
} from 'lucide-react'

interface Course {
  _id: string
  title: string
  slug: string
  thumbnail?: string
  price: number
  discountPrice?: number
  category: string
  level: string
  isPublished: boolean
  enrollmentCount: number
  rating: number
  reviewCount: number
  totalLessons: number
  instructor: { name: string; email: string }
  createdAt: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

export default function AdminCoursesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-dark flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
      <AdminCoursesContent />
    </Suspense>
  )
}

function AdminCoursesContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, pages: 0 })
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all')
  const [deleteModal, setDeleteModal] = useState<Course | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login')
    else if (status === 'authenticated') {
      const user = session?.user as any
      if (user?.role !== 'admin') router.push('/')
    }
  }, [status, session, router])

  useEffect(() => {
    if (status === 'authenticated') {
      const user = session?.user as any
      if (user?.role === 'admin') fetchCourses()
    }
  }, [pagination.page, filter, status, session])

  async function fetchCourses() {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search,
        filter
      })
      const res = await fetch(`/api/admin/courses?${params}`)
      const data = await res.json()
      setCourses(data.courses || [])
      setPagination(data.pagination || { page: 1, limit: 10, total: 0, pages: 0 })
    } catch (error) {
      toast.error('Failed to fetch courses')
    } finally {
      setLoading(false)
    }
  }

  async function deleteCourse() {
    if (!deleteModal) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/courses/${deleteModal._id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Course deleted')
        setDeleteModal(null)
        fetchCourses()
      } else {
        toast.error('Failed to delete course')
      }
    } catch {
      toast.error('Failed to delete course')
    } finally {
      setDeleting(false)
    }
  }

  function formatPrice(price: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price)
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-sora font-bold text-2xl mb-1">Course <span className="gradient-text">Manager</span></h1>
            <p className="text-gray-400 text-sm">Manage all courses on the platform</p>
          </div>
          <Link href="/admin/courses/new" className="btn-primary flex items-center gap-2 w-fit">
            <Plus className="w-4 h-4" /> Create Course
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search courses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchCourses()}
              className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'published', 'draft'] as const).map((f) => (
              <button
                key={f}
                onClick={() => { setFilter(f); setPagination(p => ({ ...p, page: 1 })) }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === f 
                    ? 'bg-primary text-white' 
                    : 'bg-card border border-border text-gray-400 hover:text-white'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="glow-card overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-20">
              <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No courses found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-card border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Course</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Instructor</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Enrolled</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {courses.map((course) => (
                    <tr key={course._id} className="hover:bg-card/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-lg flex-shrink-0">
                            {course.thumbnail ? (
                              <img src={course.thumbnail} alt="" className="w-full h-full object-cover rounded-lg" />
                            ) : '📚'}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-sm truncate max-w-[200px]">{course.title}</div>
                            <div className="text-gray-500 text-xs">{course.category} • {course.level}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">{course.instructor?.name || 'Unknown'}</div>
                        <div className="text-gray-500 text-xs">{course.instructor?.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium">
                          {course.discountPrice ? (
                            <>
                              <span className="text-green-400">{formatPrice(course.discountPrice)}</span>
                              <span className="text-gray-500 line-through text-xs ml-2">{formatPrice(course.price)}</span>
                            </>
                          ) : (
                            formatPrice(course.price)
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-sm">
                          <Users className="w-3 h-3 text-gray-500" />
                          {course.enrollmentCount || 0}
                        </div>
                        {course.rating > 0 && (
                          <div className="text-gray-500 text-xs">⭐ {course.rating.toFixed(1)} ({course.reviewCount})</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge text-xs ${
                          course.isPublished 
                            ? 'text-green-400 border-green-400/30 bg-green-400/10' 
                            : 'text-gray-400 border-gray-600 bg-gray-800'
                        }`}>
                          {course.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/courses/${course.slug}`} className="p-2 hover:bg-card rounded-lg text-gray-400 hover:text-white transition-colors">
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link href={`/admin/courses/${course._id}`} className="p-2 hover:bg-card rounded-lg text-gray-400 hover:text-white transition-colors">
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button onClick={() => setDeleteModal(course)} className="p-2 hover:bg-card rounded-lg text-gray-400 hover:text-red-400 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-gray-500 text-sm">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} courses
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                disabled={pagination.page === 1}
                className="p-2 rounded-lg border border-border hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-400 px-3">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                disabled={pagination.page === pagination.pages}
                className="p-2 rounded-lg border border-border hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glow-card p-6 max-w-md w-full">
            <h3 className="font-sora font-bold text-xl mb-2">Delete Course</h3>
            <p className="text-gray-400 text-sm mb-6">
              Are you sure you want to delete "{deleteModal.title}"? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteModal(null)} className="flex-1 btn-outline">
                Cancel
              </button>
              <button onClick={deleteCourse} disabled={deleting} className="flex-1 btn-primary bg-red-600 hover:bg-red-700">
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}