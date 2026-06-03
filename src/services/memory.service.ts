import connectDB from '@/lib/mongodb';
import Memory from '@/models/Memory';
import type { IMemory, CreateMemoryInput, UpdateMemoryInput } from '@/types/memory';

function toPlainMemory(doc: Record<string, unknown>): IMemory {
  const solarSystemId = doc.solarSystemId?.toString() ?? doc.systemId?.toString() ?? '';
  return {
    _id: doc._id?.toString() ?? '',
    universeId: doc.universeId?.toString() ?? '',
    solarSystemId,
    systemId: solarSystemId, // Backward compatibility
    title: doc.title as string,
    description: (doc.description as string) ?? '',
    orbit: doc.orbit as number,
    angle: (doc.angle as number) ?? 0,
    date: doc.date instanceof Date ? doc.date.toISOString() : (doc.date as string),
    contributorName: (doc.contributorName as string) ?? '',
    imageUrl: (doc.imageUrl as string) ?? '',
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : (doc.createdAt as string),
    updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : (doc.updatedAt as string),
  };
}

/** Fetch all memories for a solar system, sorted by memory date ascending */
export async function getMemories(systemId: string): Promise<IMemory[]> {
  await connectDB();
  const docs = await Memory.find({
    $or: [
      { solarSystemId: systemId },
      { systemId }
    ]
  }).sort({ date: 1 }).lean();
  return docs.map((d) => toPlainMemory(d as Record<string, unknown>));
}

/** Create a new memory */
export async function createMemory(
  universeId: string,
  input: CreateMemoryInput
): Promise<IMemory> {
  await connectDB();

  const solarSystemId = input.solarSystemId ?? input.systemId;

  const doc = await Memory.create({
    universeId,
    solarSystemId,
    systemId: solarSystemId,
    title: input.title,
    description: input.description ?? '',
    orbit: input.orbit,
    date: new Date(input.date),
    contributorName: input.contributorName ?? '',
    imageUrl: input.imageUrl ?? '',
    angle: 0, // Computed dynamically on the client side
  });

  return toPlainMemory(doc.toObject() as unknown as Record<string, unknown>);
}

/** Update memory details */
export async function updateMemory(
  id: string,
  universeId: string,
  input: UpdateMemoryInput
): Promise<IMemory | null> {
  await connectDB();

  const updateData: Record<string, unknown> = {};
  if (input.title !== undefined) updateData.title = input.title;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.orbit !== undefined) updateData.orbit = input.orbit;
  if (input.date !== undefined) updateData.date = new Date(input.date);
  if (input.contributorName !== undefined) updateData.contributorName = input.contributorName;
  if (input.imageUrl !== undefined) updateData.imageUrl = input.imageUrl;

  const doc = await Memory.findOneAndUpdate(
    { _id: id, universeId },
    { $set: updateData },
    { new: true, runValidators: true }
  ).lean();

  if (!doc) return null;
  return toPlainMemory(doc as Record<string, unknown>);
}

/** Delete a memory by ID */
export async function deleteMemory(
  id: string,
  universeId: string
): Promise<boolean> {
  await connectDB();
  const result = await Memory.deleteOne({ _id: id, universeId });
  return result.deletedCount === 1;
}
