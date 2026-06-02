export interface IMemory {
  _id: string;
  universeId: string;
  title: string;
  description: string;
  imageUrl?: string;
  orbit: number;
  angle: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMemoryInput {
  title: string;
  description?: string;
  imageUrl?: string;
}

export interface UpdateMemoryInput {
  title?: string;
  description?: string;
  imageUrl?: string;
}
