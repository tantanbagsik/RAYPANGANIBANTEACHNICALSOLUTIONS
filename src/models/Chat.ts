import mongoose from 'mongoose'

const chatSchema = new mongoose.Schema({
  chatId: { type: String, required: true },
  agentId: String,
  chatStatus: String,
  version: String,
  chatType: String,
  startTimestamp: Date,
  endTimestamp: Date,
  transcript: [Object],
  collectedDynamicVariables: Object,
  retellLlmDynamicVariables: Object,
  customAttributes: Object,
  metadata: Object,
  chatAnalysis: Object,
  chatCost: Number,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
}, { timestamps: true })

export default mongoose.models.Chat || mongoose.model('Chat', chatSchema)