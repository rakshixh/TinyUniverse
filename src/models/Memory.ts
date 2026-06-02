import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface IMemoryDocument extends Document {
  universeId: Types.ObjectId;
  title: string;
  description: string;
  imageUrl: string;
  orbit: number;
  angle: number;
  createdAt: Date;
  updatedAt: Date;
}

const MemorySchema = new Schema<IMemoryDocument>(
  {
    universeId: {
      type: Schema.Types.ObjectId,
      ref: 'Universe',
      required: [true, 'Universe ID is required'],
      index: true,
    },
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
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    imageUrl: {
      type: String,
      default: '',
      trim: true,
    },
    orbit: {
      type: Number,
      required: true,
      min: 1,
      max: 4,
    },
    angle: {
      type: Number,
      required: true,
      min: 0,
      max: 360,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Compound index for efficient universe queries sorted by date
MemorySchema.index({ universeId: 1, createdAt: -1 });

// Prevent model recompilation during hot reload
const Memory: Model<IMemoryDocument> =
  mongoose.models.Memory ||
  mongoose.model<IMemoryDocument>('Memory', MemorySchema);

export default Memory;
