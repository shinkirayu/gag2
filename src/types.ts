export interface PlantInfo {
  id: string;
  seedName: string;
  mutation: string;
}

export interface PetInfo {
  id: string;
  name: string;
  rarity: string;
}

export interface AccountStats {
  username: string;
  userId: number;
  sheckles: number;
  plotName: string;
  plants: PlantInfo[];
  pets: PetInfo[];
  lastUpdated: string;
}
