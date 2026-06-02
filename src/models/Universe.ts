import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IUniverseDocument extends Document {
  title: string;
  description: string;
  passcodeHash: string;
  createdAt: Date;
  updatedAt: Date;
}

const UniverseSchema = new Schema<IUniverseDocument>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    // Stored for potential future use (currently validated via env var)
    passcodeHash: {
      type: String,
      default: '',
      select: false, // Never returned in queries
    },
  },
  {
    timestamps: true,
    // Future-proof: add versioning support
    versionKey: false,
  }
);

// Prevent model recompilation during hot reload
const Universe: Model<IUniverseDocument> =
  mongoose.models.Universe ||
  mongoose.model<IUniverseDocument>('Universe', UniverseSchema);

export default Universe;
