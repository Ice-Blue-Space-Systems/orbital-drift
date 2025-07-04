import { Cartesian3 } from "cesium";

  export type DebugInfo = {
    satellitePosition: Cartesian3 | null;
    groundTrackPosition: Cartesian3 | null;
    currentTime: Date | null;
    inSight: boolean;
    groundStationPosition: Cartesian3 | null;
    satelliteVelocity: Cartesian3 | null;
  };