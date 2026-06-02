import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface ISolarSystemDocument extends Document {
  universeId: Types.ObjectId;
  name: string;
  description: string;
  starColor: string;
  starType: string;
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
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
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
