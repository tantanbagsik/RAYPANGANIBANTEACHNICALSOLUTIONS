'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { 
  ArrowLeft, Save, Loader2, Plus, Trash2, 
  GripVertical, Video, FileText, Check
} from 'lucide-react'

interface Section {
  title: string
  order: number
  lessons: { title: string; description: string; videoUrl: string; duration: number; order: number; isFree: boolean }[]
}

interface CourseData {
  title: string
  slug: string
  description: string
  shortDescription: string
  thumbnail: string
  category: string
  level: string
  price: number
  discountPrice: number
  requirements: string[]
  whatYouLearn: string[]
  sections: Section[]
  isPublished: boolean
}

const categories = ['Programming', 'Design', 'Business', 'Marketing', 'Photography', 'Music', 'Health', 'Language']
const levels = ['beginner', 'intermediate', 'advanced', 'all-levels']

export default function AdminCourseFormPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const courseId = params.id
  const isEdit = !!courseId

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [initialLoading, setInitialLoading] = useState(isEdit)

  const [form, setForm] = useState<CourseData>({
    title: '',
    slug: '',
    description: '',
    shortDescription: '',
    thumbnail: '',
    category: '',
    level: 'beginner',
    price: 0,
    discountPrice: 0,
    requirements: [''],
    whatYouLearn: [''],
    sections: [{ title: '', order: 1, lessons: [] }],
    isPublished: false
  })

  const [newRequirement, setNewRequirement] = useState('')
  const [newLearn, setNewLearn] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login')
    else if (status === 'authenticated') {
      const user = session?.user as any
      if (user?.role !== 'admin') router.push('/')
    }
  }, [status, session, router])

  useEffect(() => {
    if (isEdit && status === 'authenticated') {
      fetchCourse()
    }
  }, [isEdit, courseId, status])

  async function fetchCourse() {
    setInitialLoading(true)
    try {
      const res = await fetch(`/api/admin/courses/${courseId}`)
      const data = await res.json()
      if (data.course) {
        setForm({
          title: data.course.title || '',
          slug: data.course.slug || '',
          description: data.course.description || '',
          shortDescription: data.course.shortDescription || '',
          thumbnail: data.course.thumbnail || '',
          category: data.course.category || '',
          level: data.course.level || 'beginner',
          price: data.course.price || 0,
          discountPrice: data.course.discountPrice || 0,
          requirements: data.course.requirements?.length ? data.course.requirements : [''],
          whatYouLearn: data.course.whatYouLearn?.length ? data.course.whatYouLearn : [''],
          sections: data.course.sections?.length ? data.course.sections : [{ title: '', order: 1, lessons: [] }],
          isPublished: data.course.isPublished || false
        })
      }
    } catch {
      toast.error('Failed to load course')
    } finally {
      setInitialLoading(false)
    }
  }

  function generateSlug(title: string) {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      const cleanForm = {
        ...form,
        requirements: form.requirements.filter(r => r.trim()),
        whatYouLearn: form.whatYouLearn.filter(l => l.trim()),
        sections: form.sections
          .filter(s => s.title.trim())
          .map((s, i) => ({
            ...s,
            order: i + 1,
            lessons: s.lessons.filter(l => l.title.trim()).map((l, j) => ({ ...l, order: j + 1 }))
          }))
      }

      const url = isEdit ? `/api/admin/courses/${courseId}` : '/api/admin/courses'
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanForm)
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to save course')
        return
      }

      toast.success(isEdit ? 'Course updated!' : 'Course created!')
      router.push('/admin/courses')
    } catch {
      toast.error('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  function addRequirement() {
    if (newRequirement.trim()) {
      setForm(f => ({ ...f, requirements: [...f.requirements, newRequirement.trim()] }))
      setNewRequirement('')
    }
  }

  function removeRequirement(index: number) {
    setForm(f => ({ ...f, requirements: f.requirements.filter((_, i) => i !== index) }))
  }

  function addWhatYouLearn() {
    if (newLearn.trim()) {
      setForm(f => ({ ...f, whatYouLearn: [...f.whatYouLearn, newLearn.trim()] }))
      setNewLearn('')
    }
  }

  function removeWhatYouLearn(index: number) {
    setForm(f => ({ ...f, whatYouLearn: f.whatYouLearn.filter((_, i) => i !== index) }))
  }

  function addSection() {
    setForm(f => ({ 
      ...f, 
      sections: [...f.sections, { title: '', order: f.sections.length + 1, lessons: [] }] 
    }))
  }

  function removeSection(index: number) {
    setForm(f => ({ ...f, sections: f.sections.filter((_, i) => i !== index) }))
  }

  function addLesson(sectionIndex: number) {
    const newSections = [...form.sections]
    newSections[sectionIndex].lessons.push({
      title: '',
      description: '',
      videoUrl: '',
      duration: 0,
      order: newSections[sectionIndex].lessons.length + 1,
      isFree: false
    })
    setForm(f => ({ ...f, sections: newSections }))
  }

  function updateLesson(sectionIndex: number, lessonIndex: number, field: string, value: any) {
    const newSections = [...form.sections]
    newSections[sectionIndex].lessons[lessonIndex] = {
      ...newSections[sectionIndex].lessons[lessonIndex],
      [field]: value
    }
    setForm(f => ({ ...f, sections: newSections }))
  }

  function removeLesson(sectionIndex: number, lessonIndex: number) {
    const newSections = [...form.sections]
    newSections[sectionIndex].lessons = newSections[sectionIndex].lessons.filter((_, i) => i !== lessonIndex)
    setForm(f => ({ ...f, sections: newSections }))
  }

  if (status === 'loading' || initialLoading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark pt-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin/courses" className="p-2 hover:bg-card rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-sora font-bold text-2xl">{isEdit ? 'Edit Course' : 'Create Course'}</h1>
              <p className="text-gray-400 text-sm">{isEdit ? 'Update course details' : 'Add a new course to the platform'}</p>
            </div>
          </div>
          <button onClick={handleSubmit} disabled={saving} className="btn-primary flex items-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Course
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info */}
          <div className="glow-card p-6">
            <h2 className="font-sora font-semibold text-lg mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Course Title *</label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm(f => ({ ...f, title: e.target.value, slug: generateSlug(e.target.value) }))}
                    className="input-base"
                    placeholder="e.g., Complete Python Course"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Slug *</label>
                  <input
                    type="text"
                    required
                    value={form.slug}
                    onChange={(e) => setForm(f => ({ ...f, slug: e.target.value }))}
                    className="input-base"
                    placeholder="complete-python-course"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Short Description</label>
                <input
                  type="text"
                  value={form.shortDescription}
                  onChange={(e) => setForm(f => ({ ...f, shortDescription: e.target.value }))}
                  className="input-base"
                  placeholder="A brief summary ( displayed in cards)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Full Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                  className="input-base min-h-[120px]"
                  placeholder="Detailed course description..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
                    className="input-base"
                  >
                    <option value="">Select category</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Level</label>
                  <select
                    value={form.level}
                    onChange={(e) => setForm(f => ({ ...f, level: e.target.value }))}
                    className="input-base"
                  >
                    {levels.map(l => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1).replace('-', ' ')}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Thumbnail URL</label>
                <input
                  type="url"
                  value={form.thumbnail}
                  onChange={(e) => setForm(f => ({ ...f, thumbnail: e.target.value }))}
                  className="input-base"
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="glow-card p-6">
            <h2 className="font-sora font-semibold text-lg mb-4">Pricing</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Price ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))}
                  className="input-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Discount Price ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.discountPrice}
                  onChange={(e) => setForm(f => ({ ...f, discountPrice: parseFloat(e.target.value) || 0 }))}
                  className="input-base"
                />
              </div>
            </div>
          </div>

          {/* Requirements */}
          <div className="glow-card p-6">
            <h2 className="font-sora font-semibold text-lg mb-4">Requirements</h2>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newRequirement}
                onChange={(e) => setNewRequirement(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
                className="input-base flex-1"
                placeholder="Add a requirement..."
              />
              <button type="button" onClick={addRequirement} className="btn-outline">Add</button>
            </div>
            <div className="space-y-2">
              {form.requirements.map((r, i) => (
                <div key={i} className="flex items-center gap-2 bg-card p-2 rounded-lg">
                  <Check className="w-4 h-4 text-primary" />
                  <span className="flex-1 text-sm">{r}</span>
                  <button type="button" onClick={() => removeRequirement(i)} className="text-gray-500 hover:text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* What You'll Learn */}
          <div className="glow-card p-6">
            <h2 className="font-sora font-semibold text-lg mb-4">What You'll Learn</h2>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newLearn}
                onChange={(e) => setNewLearn(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addWhatYouLearn())}
                className="input-base flex-1"
                placeholder="Add a learning outcome..."
              />
              <button type="button" onClick={addWhatYouLearn} className="btn-outline">Add</button>
            </div>
            <div className="space-y-2">
              {form.whatYouLearn.map((l, i) => (
                <div key={i} className="flex items-center gap-2 bg-card p-2 rounded-lg">
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="flex-1 text-sm">{l}</span>
                  <button type="button" onClick={() => removeWhatYouLearn(i)} className="text-gray-500 hover:text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Sections & Lessons */}
          <div className="glow-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-sora font-semibold text-lg">Course Content</h2>
              <button type="button" onClick={addSection} className="btn-outline flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add Section
              </button>
            </div>
            <div className="space-y-4">
              {form.sections.map((section, sectionIndex) => (
                <div key={sectionIndex} className="border border-border rounded-xl overflow-hidden">
                  <div className="bg-card p-4 flex items-center gap-3">
                    <GripVertical className="w-4 h-4 text-gray-600" />
                    <input
                      type="text"
                      value={section.title}
                      onChange={(e) => {
                        const newSections = [...form.sections]
                        newSections[sectionIndex].title = e.target.value
                        setForm(f => ({ ...f, sections: newSections }))
                      }}
                      className="flex-1 bg-transparent border-none focus:outline-none font-medium"
                      placeholder="Section title..."
                    />
                    <button type="button" onClick={() => removeSection(sectionIndex)} className="text-gray-500 hover:text-red-400">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-4 space-y-3 bg-dark/50">
                    {section.lessons.map((lesson, lessonIndex) => (
                      <div key={lessonIndex} className="flex items-center gap-3 bg-card p-3 rounded-lg">
                        <Video className="w-4 h-4 text-gray-500" />
                        <input
                          type="text"
                          value={lesson.title}
                          onChange={(e) => updateLesson(sectionIndex, lessonIndex, 'title', e.target.value)}
                          className="flex-1 bg-transparent border-none focus:outline-none text-sm"
                          placeholder="Lesson title..."
                        />
                        <input
                          type="number"
                          value={lesson.duration}
                          onChange={(e) => updateLesson(sectionIndex, lessonIndex, 'duration', parseInt(e.target.value) || 0)}
                          className="w-16 bg-transparent border border-border rounded px-2 py-1 text-sm"
                          placeholder="Min"
                        />
                        <button type="button" onClick={() => removeLesson(sectionIndex, lessonIndex)} className="text-gray-500 hover:text-red-400">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addLesson(sectionIndex)}
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Lesson
                    </button>
                  </div>
                </div>
              ))}
              {form.sections.length === 0 && (
                <p className="text-gray-500 text-center py-4">No sections yet. Click "Add Section" to start.</p>
              )}
            </div>
          </div>

          {/* Publish */}
          <div className="glow-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-sora font-semibold text-lg">Publishing</h2>
                <p className="text-gray-500 text-sm">Make the course visible to students</p>
              </div>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, isPublished: !f.isPublished }))}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  form.isPublished 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                    : 'bg-gray-800 text-gray-400 border border-gray-700'
                }`}
              >
                {form.isPublished ? 'Published' : 'Draft'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}