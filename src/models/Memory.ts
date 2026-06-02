import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface IMemoryDocument extends Document {
  universeId: Types.ObjectId;
  systemId: Types.ObjectId;
  title: string;
  description: string;
  imageUrl: string;
  orbit: number;
  angle: number;
  date: Date;
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
    systemId: {
      type: Schema.Types.ObjectId,
      ref: 'SolarSystem',
      required: [true, 'Solar System ID is required'],
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
      default: 0,
      min: 0,
      max: 360,
    },
    date: {
      type: Date,
      required: [true, 'Memory date is required'],
      default: Date.now,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Compound index for listing memories in a system sorted by date
MemorySchema.index({ systemId: 1, date: 1 });

const Memory: Model<IMemoryDocument> =
  mongoose.models.Memory ||
  mongoose.model<IMemoryDocument>('Memory', MemorySchema);

export default Memory;
