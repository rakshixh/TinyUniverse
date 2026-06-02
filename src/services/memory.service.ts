import connectDB from '@/lib/mongodb';
import Memory from '@/models/Memory';
import { assignOrbitAndAngle } from '@/lib/orbit';
import type { IMemory, CreateMemoryInput, UpdateMemoryInput } from '@/types/memory';

function toPlainMemory(doc: Record<string, unknown>): IMemory {
  return {
    _id: doc._id?.toString() ?? '',
    universeId: doc.universeId?.toString() ?? '',
    title: doc.title as string,
    description: (doc.description as string) ?? '',
    imageUrl: (doc.imageUrl as string) || undefined,
    orbit: doc.orbit as number,
    angle: doc.angle as number,
    createdAt: (doc.createdAt as Date).toISOString(),
    updatedAt: (doc.updatedAt as Date).toISOString(),
  };
}

/** Fetch all memories for a universe, sorted newest first */
export async function getMemories(universeId: string): Promise<IMemory[]> {
  await connectDB();
  const docs = await Memory.find({ universeId }).sort({ createdAt: -1 }).lean();
  return docs.map((d) => toPlainMemory(d as Record<string, unknown>));
}

/** Create a new memory — auto-assigns orbit & angle */
export async function createMemory(
  universeId: string,
  input: CreateMemoryInput
): Promise<IMemory> {
  await connectDB();

  const currentCount = await Memory.countDocuments({ universeId });
  const { orbit, angle } = assignOrbitAndAngle(currentCount);

  const doc = await Memory.create({
    universeId,
    title: input.title,
    description: input.description ?? '',
    imageUrl: input.imageUrl ?? '',
    orbit,
    angle,
  });

  return toPlainMemory(doc.toObject() as unknown as Record<string, unknown>);
}

/** Update memory title/description/imageUrl — orbit & angle are immutable */
export async function updateMemory(
  id: string,
  universeId: string,
  input: UpdateMemoryInput
): Promise<IMemory | null> {
  await connectDB();

  const updateData: Partial<UpdateMemoryInput> = {};
  if (input.title !== undefined)       updateData.title = input.title;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.imageUrl !== undefined)    updateData.imageUrl = input.imageUrl;

  const doc = await Memory.findOneAndUpdate(
    { _id: id, universeId },
    { $set: updateData },
    { new: true, runValidators: true }
  ).lean();

  if (!doc) return null;
  return toPlainMemory(doc as Record<string, unknown>);
}

/** Delete a memory by id (validates universeId ownership) */
export async function deleteMemory(
  id: string,
  universeId: string
): Promise<boolean> {
  await connectDB();
  const result = await Memory.deleteOne({ _id: id, universeId });
  return result.deletedCount === 1;
}
