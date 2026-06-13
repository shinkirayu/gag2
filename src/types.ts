export interface PlantInfo {
  id: string;
  seedName: string;
  mutation: string;
}

export interface AccountStats {
  username: string;
  userId: number;
  sheckles: number;
  plotName: string;
  plants: PlantInfo[];
  lastUpdated: string;
}

export interface SupabaseConfig {
  url: string;
  key: string;
  tableName: string;
  enabled: boolean;
}
