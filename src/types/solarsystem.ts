export interface ISolarSystem {
  _id: string;
  universeId: string;
  title: string;
  name?: string; // Legacy support
  description: string;
  starColor: string;
  starType: string;
  orbit?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSolarSystemInput {
  name: string;
  title?: string;
  description?: string;
  starColor?: string;
  starType?: string;
}

export interface UpdateSolarSystemInput {
  name?: string;
  title?: string;
  description?: string;
  starColor?: string;
  starType?: string;
}
