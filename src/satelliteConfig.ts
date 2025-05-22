import { Color } from "cesium";

export interface SatelliteConfig {
  id: string;
  name: string;
  color: Color;
  // Optional TLE lines to predict future path
  tleLine1?: string;
  tleLine2?: string;
}

// Example: ISS + a sample Starlink
export const satellites: SatelliteConfig[] = [
  {
    // ISS
    id: "25544",
    name: "ISS",
    color: Color.YELLOW,
    tleLine1: "1 25544U 98067A   23146.85694444  .00004383  00000-0  85200-4 0  9993",
    tleLine2: "2 25544  51.6433 351.3515 0008379 274.6623  85.3993 15.52465932500182",
  },
  {
    id: "48274", // NORAD ID for Starlink-1506
    name: "Starlink-1506",
    color: Color.BLUE,
    tleLine1: "1 48274U 21035A   23146.85694444  .00002182  00000-0  12345-4 0  9993",
    tleLine2: "2 48274  53.0000 123.4567 0001234  45.6789 321.9876 15.12345678 12345",
  },
];