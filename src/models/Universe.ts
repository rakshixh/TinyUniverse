import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IUniverseDocument extends Document {
  title: string;
  slug: string;
  description: string;
  accessCodeHash: string;
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
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    accessCodeHash: {
      type: String,
      required: [true, 'Access code hash is required'],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Prevent model recompilation during hot reload
const Universe: Model<IUniverseDocument> =
  mongoose.models.Universe ||
  mongoose.model<IUniverseDocument>('Universe', UniverseSchema);

export default Universe;
