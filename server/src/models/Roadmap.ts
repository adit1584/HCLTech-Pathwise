import mongoose, { Schema, Document } from 'mongoose';

export interface IRoadmapItem {
  id: string;
  itemId?: string;
  type: string;
  title: string;
  skillIds: string[];
  prerequisiteIds: string[];
  prerequisiteItemIds?: string[];
  estimatedHours: number;
  priorityScore: number;
  status: string;
  reason: string;
  unlocks: string[];
  resourceIds: string[];
  milestone: number;
}

export interface IRoadmap extends Document {
  learnerId: string;
  items: IRoadmapItem[];
  totalEstimatedWeeks: number;
  version: number;
  compiledAt: Date;
}

const RoadmapItemSchema = new Schema({
  id: { type: String, required: true },
  itemId: { type: String },
  type: {
    type: String,
    enum: ['SKILL', 'COURSE', 'PROJECT', 'ASSESSMENT', 'PRACTICE'],
    required: true,
  },
  title: { type: String, required: true },
  skillIds: [String],
  prerequisiteIds: [String],
  prerequisiteItemIds: [String],
  estimatedHours: { type: Number, default: 0 },
  priorityScore: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['locked', 'available', 'in_progress', 'completed', 'skipped'],
    default: 'locked',
  },
  reason: { type: String, default: '' },
  unlocks: [String],
  resourceIds: [String],
  milestone: { type: Number, default: 1 },
}, { _id: false, strict: false });

const RoadmapSchema = new Schema({
  learnerId: { type: String, required: true, index: true },
  items: [RoadmapItemSchema],
  totalEstimatedWeeks: { type: Number, default: 0 },
  version: { type: Number, default: 1 },
  compiledAt: { type: Date, default: Date.now },
}, { strict: false });

RoadmapSchema.index({ learnerId: 1, version: -1 });

export const RoadmapModel = mongoose.model<IRoadmap>('Roadmap', RoadmapSchema);
