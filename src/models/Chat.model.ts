import mongoose, { Document, Schema } from 'mongoose';

// ============================================================
// Chat Model — AI chat sessions with report context
// ============================================================

export interface IChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  tokensUsed?: number;
}

export interface IChat extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  reportId: mongoose.Types.ObjectId;
  title: string;
  sessionTitle?: string;
  messages: IChatMessage[];
  messageCount: number;
  tokenCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const chatMessageSchema = new Schema<IChatMessage>(
  {
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: [10000, 'Message cannot exceed 10,000 characters'],
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    tokensUsed: {
      type: Number,
    },
  },
  { _id: false }
);

const chatSchema = new Schema<IChat>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    reportId: {
      type: Schema.Types.ObjectId,
      ref: 'Report',
      required: true,
      index: true,
    },
    title: {
      type: String,
      maxlength: [300, 'Title cannot exceed 300 characters'],
      default: 'AI Chat Session',
    },
    sessionTitle: {
      type: String,
      maxlength: [200, 'Session title cannot exceed 200 characters'],
    },
    messages: [chatMessageSchema],
    messageCount: {
      type: Number,
      default: 0,
    },
    tokenCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Update message count on save
chatSchema.pre('save', function (next) {
  this.messageCount = this.messages.length;
  next();
});

// Indexes
chatSchema.index({ userId: 1, reportId: 1 });
chatSchema.index({ updatedAt: -1 });

export const ChatModel = mongoose.model<IChat>('Chat', chatSchema);
