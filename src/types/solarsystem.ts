export interface ISolarSystem {
  _id: string;
  universeId: string;
  name: string;
  description: string;
  starColor: string;
  starType: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSolarSystemInput {
  name: string;
  description?: string;
  starColor?: string;
  starType?: string;
}

export interface UpdateSolarSystemInput {
  name?: string;
  description?: string;
  starColor?: string;
  starType?: string;
}
