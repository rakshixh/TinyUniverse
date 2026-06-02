export interface IUniverse {
  _id: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUniverseInput {
  title: string;
  description?: string;
}

export interface UpdateUniverseInput {
  title?: string;
  description?: string;
}
