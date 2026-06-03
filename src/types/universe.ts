export interface IUniverse {
  _id: string;
  title: string;
  slug: string;
  description: string;
  accessCodeHash?: string;
  createdAt: string;
  updatedAt: string;
  solarSystemCount?: number;
  memoryCount?: number;
}

export interface CreateUniverseInput {
  title: string;
  description?: string;
  accessCode: string;
}

export interface UpdateUniverseInput {
  title?: string;
  description?: string;
  accessCode?: string;
}
