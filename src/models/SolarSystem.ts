import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface ISolarSystemDocument extends Document {
  universeId: Types.ObjectId;
  title: string;
  name?: string; // Legacy field
  description: string;
  starColor: string;
  starType: string;
  orbit?: number;
  createdAt: Date;
  updatedAt: Date;
}

const SolarSystemSchema = new Schema<ISolarSystemDocument>(
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
    name: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    starColor: {
      type: String,
      default: '#FBBF24',
      trim: true,
    },
    starType: {
      type: String,
      default: 'dwarf',
      trim: true,
    },
    orbit: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Compound index for listing systems in a universe
SolarSystemSchema.index({ universeId: 1, createdAt: -1 });

const SolarSystem: Model<ISolarSystemDocument> =
  mongoose.models.SolarSystem ||
  mongoose.model<ISolarSystemDocument>('SolarSystem', SolarSystemSchema);

export default SolarSystem;
