export interface SatelliteDataSource {
  getTLE(noradId: string): Promise<{ tle1: string; tle2: string } | null>;
  getLivePosition(noradId: string): Promise<{ lat: number; lon: number; alt: number }>;
}