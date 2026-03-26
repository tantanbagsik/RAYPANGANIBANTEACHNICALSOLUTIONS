import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'

/**
 * Award points to a user for various actions
 * @param userId - The user's MongoDB ObjectId
 * @param amount - Number of points to award
 * @param type - Type of points: 'topup', 'purchase', or 'earned'
 * @param description - Description of why points were awarded
 * @returns Updated user points balance
 */
export async function awardPoints(
  userId: string | mongoose.Types.ObjectId,
  amount: number,
  type: 'topup' | 'purchase' | 'earned',
  description: string
) {
  try {
    await connectDB()
    
    const userData = await User.findByIdAndUpdate(
      userId,
      {
        $inc: { points: amount },
        $push: {
          pointsHistory: {
            amount,
            type,
            description,
            createdAt: new Date()
          }
        }
      },
      { new: true }
    ).select('points')
    
    return userData?.points || 0
  } catch (error) {
    console.error('Error awarding points:', error)
    throw error
  }
}

/**
 * Award points specifically for positive Retell chat interactions
 * @param userId - The user's MongoDB ObjectId
 * @param chatData - The chat data from Retell
 * @returns Updated user points balance
 */
export async function awardPointsForPositiveChat(
  userId: string | mongoose.Types.ObjectId,
  chatData: any
) {
  // Only award points for successful chats with positive sentiment
  const isSuccessful = chatData.chat_analysis?.chat_successful === true
  const isPositive = chatData.chat_analysis?.user_sentiment === 'Positive'
  
  if (isSuccessful && isPositive) {
    // Award 10 points for positive, successful chats
    return awardPoints(
      userId,
      10,
      'earned',
      `Positive support chat: ${chatData.chat_analysis?.chat_summary || 'Chat interaction'}`
    )
  }
  
  // Return current points if no points awarded
  await connectDB()
  const userData = await User.findById(userId).select('points')
  return userData?.points || 0
}