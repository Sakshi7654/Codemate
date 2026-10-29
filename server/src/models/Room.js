//database data structure

import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: [true, 'Room ID is required'],
      unique: true,
      index: true, // O(1) indexed lookups
      trim: true,
    },
    title: {
      type: String,
      default: 'Untitled Doubt Session',
      trim: true,
      maxLength: [100, 'Title cannot exceed 100 characters'],
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Creates a relationship with the User model
      required: [true, 'Room must have a host user'],
    },
    recordingUrl: {
      type: String,
      default: null, // Populated after an S3 / Cloudinary upload completes
      trim: true,
    },
    language: {
      type: String,
      enum: ['javascript', 'python', 'cpp'],
      default: 'javascript',
    },
    code: {
      type: String,
      default: '// Welcome to CodeMate\n',
    },
    versionHistory: [
      {
        code: String,
        savedAt: { type: Date, default: Date.now },
        author: { type: String, default: 'System' },
      },
    ],
  },
  {  // this is the second argument, that controls how mongoose manages the schema
    timestamps: true // automatically manages createdAt and updatedAt
  }
);

export default mongoose.model('Room', roomSchema);