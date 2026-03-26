import { NextResponse } from 'next/server'
import Chat from '@/models/Chat'
import mongoose from 'mongoose'
import { connectDB } from '@/lib/mongodb'
import { awardPointsForPositiveChat } from '@/lib/points'

export async function POST(request: Request) {
  try {
    await connectDB()
    
    const chatData = await request.json()
    
    // Validate required fields
    if (!chatData.chat_id || !chatData.agent_id) {
      return NextResponse.json(
        { error: 'Missing required fields: chat_id and agent_id' },
        { status: 400 }
      )
    }
    
    // Try to find user by name from dynamic variables
    let userId = null
    const customerName = chatData.retell_llm_dynamic_variables?.customer_name
    if (customerName) {
      // In a real app, you'd want a more robust matching strategy
      // This is simplified - you might want to use email or other unique identifiers
      const User = mongoose.models.User || mongoose.model('User')
      const user = await User.findOne({ 
        name: { $regex: new RegExp(customerName, 'i') } 
      })
      if (user) userId = user._id
    }
    
    // Create chat document
    const chat = new Chat({
      chatId: chatData.chat_id,
      agentId: chatData.agent_id,
      chatStatus: chatData.chat_status,
      version: chatData.version,
      chatType: chatData.chat_type,
      startTimestamp: chatData.start_timestamp,
      endTimestamp: chatData.end_timestamp,
      transcript: chatData.transcript,
      collectedDynamicVariables: chatData.collected_dynamic_variables,
      retellLlmDynamicVariables: chatData.retell_llm_dynamic_variables,
      customAttributes: chatData.custom_attributes,
      metadata: chatData.metadata,
      chatAnalysis: chatData.chat_analysis,
      chatCost: chatData.chat_cost,
      userId: userId ? new mongoose.Types.ObjectId(userId) : undefined
    })
    
    await chat.save()
    
    // Award points for positive, successful chats if we found a user
    let pointsAwarded = 0
    if (userId) {
      pointsAwarded = await awardPointsForPositiveChat(userId, chatData)
    }
    
    return NextResponse.json(
      { 
        success: true, 
        chatId: chat._id,
        pointsAwarded
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error storing chat:', error)
    return NextResponse.json(
      { error: 'Failed to store chat' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const courseId = searchParams.get('courseId')
    const limit = parseInt(searchParams.get('limit') || '10')
    const page = parseInt(searchParams.get('page') || '1')
    const skip = (page - 1) * limit
    
    const filter: any = {}
    if (userId) filter.userId = userId
    if (courseId) filter.courseId = courseId
    
    const chats = await Chat.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name email role')
      .populate('courseId', 'title slug thumbnail')
    
    const total = await Chat.countDocuments(filter)
    
    return NextResponse.json({
      chats,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching chats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chats' },
      { status: 500 }
    )
  }
}