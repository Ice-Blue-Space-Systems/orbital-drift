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
