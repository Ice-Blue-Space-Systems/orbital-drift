import { Cartesian3 } from "cesium";

export interface Satellite {
  _id: string;
  name: string;
  type: "live" | "simulated";
  noradId?: number; // Only for live satellites
  description?: string; // Optional description
  currentTleId?: string; // Only for simulated satellites
}

export interface GroundStation {
  _id: string;
  name: string;
  location: {
    lat: number;
    lon: number;
    alt: number;
  };
  // Enhanced fields for comprehensive ground station management
  country?: string;
  city?: string;
  status?: "Active" | "Inactive" | "Maintenance" | "Decommissioned";
  frequency?: string; // Frequency range in MHz
  bandType?: "S" | "X" | "Ka" | "Ku" | "L" | "C" | "Unknown";
  elevation?: number; // Minimum elevation angle
  azimuth?: number; // Antenna azimuth range
  operator?: string;
  established?: Date;
  description?: string;
  source?: "predefined" | "custom";
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ContactWindow {
  _id: string;
  satelliteId: string;
  groundStationId: string;
  scheduledAOS: string; // ISO date string
  scheduledLOS: string; // ISO date string
}

export interface DebugInfo {
  satellitePosition: Cartesian3 | null;
  groundTrackPosition: Cartesian3 | null;
  currentTime: Date | null;
  inSight: boolean;
  groundStationPosition: Cartesian3 | null;
  satelliteVelocity: Cartesian3 | null;
}
