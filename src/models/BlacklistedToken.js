import mongoose from 'mongoose';

const blacklistedTokenSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // This will automatically delete documents when they expire
    },
  },
  { timestamps: true }
);

// Create a compound index for userId and token
blacklistedTokenSchema.index({ userId: 1, token: 1 });

const BlacklistedToken = mongoose.model('BlacklistedToken', blacklistedTokenSchema);

export default BlacklistedToken;
