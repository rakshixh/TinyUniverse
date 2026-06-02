export interface IMemory {
  _id: string;
  universeId: string;
  systemId: string;
  title: string;
  description: string;
  orbit: number;
  angle: number;
  date: string; // ISO String format
  createdAt: string;
  updatedAt: string;
}

export interface CreateMemoryInput {
  title: string;
  description?: string;
  orbit: number;
  date: string;
  systemId: string;
}

export interface UpdateMemoryInput {
  title?: string;
  description?: string;
  orbit?: number;
  date?: string;
}
