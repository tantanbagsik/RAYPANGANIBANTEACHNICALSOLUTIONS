import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import Course from '@/models/Course'
import User from '@/models/User'
import * as dns from 'dns'
dns.setServers(['1.1.1.1'])

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const user = session?.user as any
    if (!session || user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const filter = searchParams.get('filter') || 'all'

    await connectDB()

    const query: any = {}
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    }
    
    if (filter === 'published') query.isPublished = true
    if (filter === 'draft') query.isPublished = false

    const skip = (page - 1) * limit
    
    const [courses, total] = await Promise.all([
      Course.find(query)
        .populate('instructor', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Course.countDocuments(query)
    ])

    return NextResponse.json({
      courses: courses.map((c: any) => ({
        ...c,
        _id: c._id.toString(),
        instructor: c.instructor ? {
          _id: c.instructor._id?.toString(),
          name: c.instructor.name,
          email: c.instructor.email
        } : null
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('[ADMIN COURSES GET]', error)
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const user = session?.user as any
    if (!session || user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { title, slug, description, shortDescription, thumbnail, category, level, price, discountPrice, requirements, whatYouLearn, sections, instructorId } = body

    await connectDB()

    if (!title || !slug) {
      return NextResponse.json({ error: 'Title and slug are required' }, { status: 400 })
    }

    const existing = await Course.findOne({ slug })
    if (existing) {
      return NextResponse.json({ error: 'Course with this slug already exists' }, { status: 409 })
    }

    const course = await Course.create({
      title,
      slug,
      description,
      shortDescription,
      thumbnail,
      category,
      level: level || 'beginner',
      price: price || 0,
      discountPrice,
      requirements: requirements || [],
      whatYouLearn: whatYouLearn || [],
      sections: sections || [],
      totalLessons: sections?.reduce((acc: number, s: any) => acc + (s.lessons?.length || 0), 0) || 0,
      instructor: instructorId || user.id,
      isPublished: false
    })

    return NextResponse.json({ course: { ...course.toObject(), _id: course._id.toString() } }, { status: 201 })
  } catch (error) {
    console.error('[ADMIN COURSES POST]', error)
    return NextResponse.json({ error: 'Failed to create course' }, { status: 500 })
  }
}