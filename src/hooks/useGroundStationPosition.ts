import { useEffect, useState } from "react";
import { Cartesian3 } from "cesium";

export function useGroundStationPosition(
  selectedGroundStationId: string | null,
  groundStations: any[]
): Cartesian3 | null {
  const [groundStationPos, setGroundStationPos] = useState<Cartesian3 | null>(
    null
  );

  useEffect(() => {
    const station = groundStations.find(
      (gs) => gs._id === selectedGroundStationId
    );
    if (station) {
      const { lat, lon, alt } = station.location;
      setGroundStationPos(Cartesian3.fromDegrees(lon, lat, alt * 1000));
    } else {
      setGroundStationPos(null);
    }
  }, [selectedGroundStationId, groundStations]);

  return groundStationPos;
}