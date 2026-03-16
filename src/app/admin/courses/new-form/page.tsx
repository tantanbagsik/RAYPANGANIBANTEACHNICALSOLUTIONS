'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { 
  ArrowLeft, Save, Loader2, Plus, Trash2, 
  GripVertical, Video, FileText, Check, Upload,
  Image, File, X, Search, Bookmark, Highlight,
  ChevronRight, ChevronLeft, ZoomIn, ZoomOut,
  List, ArrowUp, Download, ExternalLink
} from 'lucide-react'

interface Section {
  title: string
  order: number
  lessons: { title: string; description: string; videoUrl: string; duration: number; order: number; isFree: boolean }[]
}

interface EbookFile {
  id: string
  title: string
  url: string
  type: 'pdf' | 'image' | 'other'
  uploadMethod: 'upload' | 'url' | 'dragdrop'
  pages?: number
  tableOfContents?: { title: string; page: number }[]
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
  ebooks: EbookFile[]
  isPublished: boolean
}

const categories = ['Programming', 'Design', 'Business', 'Marketing', 'Photography', 'Music', 'Health', 'Language']
const levels = ['beginner', 'intermediate', 'advanced', 'all-levels']

type Tab = 'basic' | 'pricing' | 'requirements' | 'content' | 'ebooks'

export default function NewCourseFormPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('basic')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

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
    ebooks: [],
    isPublished: false
  })

  const [newRequirement, setNewRequirement] = useState('')
  const [newLearn, setNewLearn] = useState('')
  
  const [ebookTitle, setEbookTitle] = useState('')
  const [ebookUrl, setEbookUrl] = useState('')
  const [ebookType, setEbookType] = useState<'pdf' | 'image' | 'other'>('pdf')
  const [uploadMethod, setUploadMethod] = useState<'url' | 'upload' | 'dragdrop'>('url')
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedEbook, setSelectedEbook] = useState<EbookFile | null>(null)
  const [flipbookMode, setFlipbookMode] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [zoom, setZoom] = useState(100)
  const [searchQuery, setSearchQuery] = useState('')
  const [bookmarks, setBookmarks] = useState<number[]>([])
  const [showToc, setShowToc] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login')
    else if (status === 'authenticated') {
      const user = session?.user as any
      if (user?.role !== 'admin') router.push('/')
    }
  }, [status, session, router])

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

      const res = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanForm)
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to save course')
        return
      }

      toast.success('Course created!')
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

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileUpload(files[0])
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files[0])
    }
  }

  const handleFileUpload = async (file: File) => {
    if (!ebookTitle.trim()) {
      toast.error('Please enter a title for the ebook first')
      return
    }

    setUploading(true)
    try {
      const fakeUrl = URL.createObjectURL(file)
      const newEbook: EbookFile = {
        id: Date.now().toString(),
        title: ebookTitle.trim(),
        url: fakeUrl,
        type: file.type.includes('pdf') ? 'pdf' : file.type.startsWith('image/') ? 'image' : 'other',
        uploadMethod: 'dragdrop',
        pages: Math.ceil(file.size / 1024)
      }
      
      setForm(f => ({ ...f, ebooks: [...f.ebooks, newEbook] }))
      setEbookTitle('')
      toast.success('Ebook added!')
    } catch {
      toast.error('Failed to upload file')
    } finally {
      setUploading(false)
    }
  }

  const addEbook = () => {
    if (!ebookTitle.trim() || !ebookUrl.trim()) {
      toast.error('Please enter title and URL')
      return
    }

    const newEbook: EbookFile = {
      id: Date.now().toString(),
      title: ebookTitle.trim(),
      url: ebookUrl.trim(),
      type: ebookType,
      uploadMethod: uploadMethod,
      pages: 0
    }

    setForm(f => ({ ...f, ebooks: [...f.ebooks, newEbook] }))
    setEbookTitle('')
    setEbookUrl('')
    toast.success('Ebook added!')
  }

  const removeEbook = (id: string) => {
    setForm(f => ({ ...f, ebooks: f.ebooks.filter(e => e.id !== id) }))
    if (selectedEbook?.id === id) {
      setSelectedEbook(null)
      setFlipbookMode(false)
    }
  }

  const toggleBookmark = (page: number) => {
    if (bookmarks.includes(page)) {
      setBookmarks(b => b.filter(p => p !== page))
    } else {
      setBookmarks(b => [...b, page])
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'requirements', label: 'Requirements' },
    { id: 'content', label: 'Content' },
    { id: 'ebooks', label: '📚 Flipbooks & Ebooks' },
  ]

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark pt-20">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin/courses" className="p-2 hover:bg-card rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-sora font-bold text-2xl">Create Course</h1>
              <p className="text-gray-400 text-sm">Add a new course to the platform</p>
            </div>
          </div>
          <button onClick={handleSubmit} disabled={saving} className="btn-primary flex items-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Course
          </button>
        </div>

        <div className="flex gap-1 mb-6 border-b border-border overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id 
                  ? 'text-primary border-b-2 border-primary -mb-px' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {activeTab === 'basic' && (
            <div className="glow-card p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Course Title *</label>
                  <input type="text" required value={form.title}
                    onChange={(e) => setForm(f => ({ ...f, title: e.target.value, slug: generateSlug(e.target.value) }))}
                    className="input-base" placeholder="e.g., Complete Python Course" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Slug *</label>
                  <input type="text" required value={form.slug}
                    onChange={(e) => setForm(f => ({ ...f, slug: e.target.value }))}
                    className="input-base" placeholder="complete-python-course" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Short Description</label>
                <input type="text" value={form.shortDescription}
                  onChange={(e) => setForm(f => ({ ...f, shortDescription: e.target.value }))}
                  className="input-base" placeholder="A brief summary" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Full Description</label>
                <textarea value={form.description}
                  onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                  className="input-base min-h-[120px]" placeholder="Detailed course description..." />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Category</label>
                  <select value={form.category} onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))} className="input-base">
                    <option value="">Select category</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Level</label>
                  <select value={form.level} onChange={(e) => setForm(f => ({ ...f, level: e.target.value }))} className="input-base">
                    {levels.map(l => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1).replace('-', ' ')}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Thumbnail URL</label>
                <input type="url" value={form.thumbnail}
                  onChange={(e) => setForm(f => ({ ...f, thumbnail: e.target.value }))}
                  className="input-base" placeholder="https://..." />
              </div>
            </div>
          )}

          {activeTab === 'pricing' && (
            <div className="glow-card p-6">
              <h2 className="font-sora font-semibold text-lg mb-4">Pricing</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Price ($)</label>
                  <input type="number" min="0" step="0.01" value={form.price}
                    onChange={(e) => setForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))} className="input-base" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Discount Price ($)</label>
                  <input type="number" min="0" step="0.01" value={form.discountPrice}
                    onChange={(e) => setForm(f => ({ ...f, discountPrice: parseFloat(e.target.value) || 0 }))} className="input-base" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'requirements' && (
            <div className="space-y-6">
              <div className="glow-card p-6">
                <h2 className="font-sora font-semibold text-lg mb-4">Requirements</h2>
                <div className="flex gap-2 mb-4">
                  <input type="text" value={newRequirement} onChange={(e) => setNewRequirement(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
                    className="input-base flex-1" placeholder="Add a requirement..." />
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
              <div className="glow-card p-6">
                <h2 className="font-sora font-semibold text-lg mb-4">What You'll Learn</h2>
                <div className="flex gap-2 mb-4">
                  <input type="text" value={newLearn} onChange={(e) => setNewLearn(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addWhatYouLearn())}
                    className="input-base flex-1" placeholder="Add a learning outcome..." />
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
            </div>
          )}

          {activeTab === 'content' && (
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
                      <input type="text" value={section.title}
                        onChange={(e) => {
                          const newSections = [...form.sections]
                          newSections[sectionIndex].title = e.target.value
                          setForm(f => ({ ...f, sections: newSections }))
                        }}
                        className="flex-1 bg-transparent border-none focus:outline-none font-medium" placeholder="Section title..." />
                      <button type="button" onClick={() => removeSection(sectionIndex)} className="text-gray-500 hover:text-red-400">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="p-4 space-y-3 bg-dark/50">
                      {section.lessons.map((lesson, lessonIndex) => (
                        <div key={lessonIndex} className="flex items-center gap-3 bg-card p-3 rounded-lg">
                          <Video className="w-4 h-4 text-gray-500" />
                          <input type="text" value={lesson.title}
                            onChange={(e) => updateLesson(sectionIndex, lessonIndex, 'title', e.target.value)}
                            className="flex-1 bg-transparent border-none focus:outline-none text-sm" placeholder="Lesson title..." />
                          <input type="number" value={lesson.duration}
                            onChange={(e) => updateLesson(sectionIndex, lessonIndex, 'duration', parseInt(e.target.value) || 0)}
                            className="w-16 bg-transparent border border-border rounded px-2 py-1 text-sm" placeholder="Min" />
                          <button type="button" onClick={() => removeLesson(sectionIndex, lessonIndex)} className="text-gray-500 hover:text-red-400">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button type="button" onClick={() => addLesson(sectionIndex)}
                        className="text-sm text-primary hover:underline flex items-center gap-1">
                        <Plus className="w-3 h-3" /> Add Lesson
                      </button>
                    </div>
                  </div>
                ))}
                {form.sections.length === 0 && <p className="text-gray-500 text-center py-4">No sections yet. Click "Add Section" to start.</p>}
              </div>
            </div>
          )}

          {activeTab === 'ebooks' && (
            <div className="space-y-6">
              <div className="glow-card p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Upload className="w-5 h-5 text-primary" />
                  <h2 className="font-sora font-semibold text-lg">📚 Flipbook / Ebook with Animation</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Ebook Title</label>
                    <input type="text" value={ebookTitle} onChange={(e) => setEbookTitle(e.target.value)}
                      className="input-base" placeholder="e.g., Complete Python Guide" />
                  </div>
                  <div className="flex gap-2">
                    {[
                      { id: 'url', label: '🔗 URL Link' },
                      { id: 'upload', label: '📁 Upload File' },
                      { id: 'dragdrop', label: '🎯 Drag & Drop' }
                    ].map(m => (
                      <button key={m.id} type="button" onClick={() => setUploadMethod(m.id as any)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          uploadMethod === m.id ? 'bg-primary text-white' : 'bg-card border border-border text-gray-400 hover:text-white'
                        }`}>
                        {m.label}
                      </button>
                    ))}
                  </div>

                  {uploadMethod === 'url' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1.5">File URL</label>
                        <input type="url" value={ebookUrl} onChange={(e) => setEbookUrl(e.target.value)}
                          className="input-base" placeholder="https://...pdf" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1.5">Type</label>
                        <select value={ebookType} onChange={(e) => setEbookType(e.target.value as any)} className="input-base">
                          <option value="pdf">PDF</option>
                          <option value="image">Image</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {uploadMethod === 'upload' && (
                    <div>
                      <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
                        onChange={handleFileSelect} className="hidden" />
                      <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
                        className="w-full p-8 border-2 border-dashed border-border rounded-xl hover:border-primary transition-colors flex flex-col items-center gap-3">
                        {uploading ? <Loader2 className="w-8 h-8 animate-spin text-primary" /> : 
                          (<><Upload className="w-8 h-8 text-gray-500" /><p className="text-gray-400">Click to upload PDF or images</p></>)}
                      </button>
                    </div>
                  )}

                  {uploadMethod === 'dragdrop' && (
                    <div ref={dropZoneRef} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                      className={`p-8 border-2 border-dashed rounded-xl transition-colors flex flex-col items-center gap-3 cursor-pointer ${
                        isDragging ? 'border-primary bg-primary/10' : 'border-border hover:border-primary'
                      }`}>
                      <Upload className="w-8 h-8 text-gray-500" />
                      <p className="text-gray-400">Drag and drop PDF or images here</p>
                      <p className="text-gray-600 text-sm">or click to browse</p>
                    </div>
                  )}

                  <button type="button" onClick={addEbook}
                    disabled={!ebookTitle.trim() || (uploadMethod !== 'dragdrop' && !ebookUrl.trim())}
                    className="btn-primary flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Add Ebook
                  </button>
                </div>
              </div>

              {form.ebooks.length > 0 && (
                <div className="glow-card p-6">
                  <h3 className="font-sora font-semibold text-lg mb-4">Your Flipbooks & Ebooks ({form.ebooks.length})</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {form.ebooks.map(ebook => (
                      <div key={ebook.id} className="flex items-center gap-4 bg-card p-4 rounded-xl">
                        <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                          <FileText className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{ebook.title}</p>
                          <p className="text-gray-500 text-xs truncate">{ebook.url}</p>
                        </div>
                        <button type="button" onClick={() => { setSelectedEbook(ebook); setFlipbookMode(true); }}
                          className="p-2 hover:bg-border rounded-lg text-primary">
                          <ExternalLink className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => removeEbook(ebook.id)} className="p-2 hover:bg-border rounded-lg text-red-400">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {form.ebooks.length === 0 && (
                <div className="glow-card p-12 text-center">
                  <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500">No ebooks added yet</p>
                  <p className="text-gray-600 text-sm mt-1">Add PDFs using URL, upload, or drag & drop above</p>
                </div>
              )}
            </div>
          )}

          <div className="glow-card p-6 mt-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-sora font-semibold text-lg">Publishing</h2>
                <p className="text-gray-500 text-sm">Make the course visible to students</p>
              </div>
              <button type="button" onClick={() => setForm(f => ({ ...f, isPublished: !f.isPublished }))}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  form.isPublished ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-gray-800 text-gray-400 border border-gray-700'
                }`}>
                {form.isPublished ? 'Published' : 'Draft'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {flipbookMode && selectedEbook && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
          <div className="flex items-center justify-between p-4 bg-card border-b border-border">
            <div className="flex items-center gap-4">
              <button onClick={() => { setFlipbookMode(false); setSelectedEbook(null); }} className="p-2 hover:bg-border rounded-lg">
                <X className="w-5 h-5" />
              </button>
              <h3 className="font-sora font-semibold">{selectedEbook.title}</h3>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-dark border border-border rounded-lg pl-10 pr-4 py-2 text-sm w-48" />
              </div>
              <button onClick={() => setShowToc(!showToc)} className={`p-2 rounded-lg ${showToc ? 'bg-primary text-white' : 'hover:bg-border'}`}>
                <List className="w-4 h-4" />
              </button>
              <button onClick={() => toggleBookmark(currentPage)} className={`p-2 rounded-lg ${bookmarks.includes(currentPage) ? 'text-yellow-400' : 'hover:bg-border'}`}>
                <Bookmark className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2 border border-border rounded-lg px-2">
                <button onClick={() => setZoom(z => Math.max(50, z - 10))} className="p-1 hover:bg-border"><ZoomOut className="w-4 h-4" /></button>
                <span className="text-sm w-12 text-center">{zoom}%</span>
                <button onClick={() => setZoom(z => Math.min(200, z + 10))} className="p-1 hover:bg-border"><ZoomIn className="w-4 h-4" /></button>
              </div>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {showToc && (
              <div className="w-64 bg-card border-r border-border p-4 overflow-y-auto">
                <h4 className="font-semibold text-sm mb-4 flex items-center gap-2"><List className="w-4 h-4" /> Table of Contents</h4>
                <div className="space-y-2">
                  {selectedEbook.tableOfContents?.length ? (
                    selectedEbook.tableOfContents.map((item, i) => (
                      <button key={i} onClick={() => setCurrentPage(item.page)}
                        className="w-full text-left p-2 rounded-lg hover:bg-border text-sm text-gray-400 hover:text-white">
                        {item.title}
                      </button>
                    ))
                  ) : (<p className="text-gray-500 text-sm">No TOC available</p>)}
                </div>
                {bookmarks.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-semibold text-sm mb-4 flex items-center gap-2"><Bookmark className="w-4 h-4 text-yellow-400" /> Bookmarks</h4>
                    <div className="space-y-2">
                      {bookmarks.map(page => (
                        <button key={page} onClick={() => setCurrentPage(page)} className="w-full text-left p-2 rounded-lg hover:bg-border text-sm">
                          Page {page}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex-1 flex items-center justify-center p-8 bg-dark overflow-auto">
              <div className="bg-white rounded-lg shadow-2xl transition-transform duration-300" style={{ transform: `scale(${zoom / 100})`, maxWidth: '800px', minHeight: '600px' }}>
                {selectedEbook.type === 'pdf' ? (
                  <iframe src={`${selectedEbook.url}#page=${currentPage}`} className="w-[800px] h-[600px] rounded-lg" title="PDF Viewer" />
                ) : (
                  <img src={selectedEbook.url} alt={selectedEbook.title} className="max-w-full h-auto rounded-lg" />
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 p-4 bg-card border-t border-border">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 hover:bg-border rounded-lg disabled:opacity-50">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <input type="number" value={currentPage} onChange={(e) => setCurrentPage(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 bg-dark border border-border rounded-lg px-2 py-1 text-center text-sm" />
              <span className="text-gray-500">/ {totalPages || '—'}</span>
            </div>
            <button onClick={() => setCurrentPage(p => p + 1)} className="p-2 hover:bg-border rounded-lg">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}