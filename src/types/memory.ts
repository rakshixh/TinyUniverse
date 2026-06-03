export interface IMemory {
  _id: string;
  universeId: string;
  solarSystemId: string;
  systemId?: string; // Legacy support
  title: string;
  description: string;
  orbit: number;
  angle: number;
  date: string; // ISO String format
  contributorName?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMemoryInput {
  title: string;
  description?: string;
  orbit: number;
  date: string;
  solarSystemId?: string;
  systemId?: string; // Legacy support
  contributorName?: string;
  imageUrl?: string;
}

export interface UpdateMemoryInput {
  title?: string;
  description?: string;
  orbit?: number;
  date?: string;
  contributorName?: string;
  imageUrl?: string;
}
