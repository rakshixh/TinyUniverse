import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface IMemoryDocument extends Document {
  universeId: Types.ObjectId;
  solarSystemId: Types.ObjectId;
  systemId?: Types.ObjectId; // Legacy field
  title: string;
  description: string;
  orbit: number;
  angle: number;
  date: Date;
  contributorName?: string;
  imageUrl?: string;
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
    solarSystemId: {
      type: Schema.Types.ObjectId,
      ref: 'SolarSystem',
      required: [true, 'Solar System ID is required'],
      index: true,
    },
    systemId: {
      type: Schema.Types.ObjectId,
      ref: 'SolarSystem',
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
    contributorName: {
      type: String,
      trim: true,
      default: '',
    },
    imageUrl: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Compound index for listing memories in a system sorted by date
MemorySchema.index({ solarSystemId: 1, date: 1 });
MemorySchema.index({ universeId: 1, solarSystemId: 1 });

const Memory: Model<IMemoryDocument> =
  mongoose.models.Memory ||
  mongoose.model<IMemoryDocument>('Memory', MemorySchema);

export default Memory;
