import { useEffect, useState, useMemo } from "react";
import { Cartesian3 } from "cesium";
import { getDisplayGroundStations, type DisplayGroundStation } from "../utils/groundStationDataUtils";

export function useGroundStationPosition(
  selectedGroundStationId: string | null,
  groundStations: any[]
): Cartesian3 | null {
  const [groundStationPos, setGroundStationPos] = useState<Cartesian3 | null>(
    null
  );

  // Get merged ground station data (API + predefined)
  const displayGroundStations = useMemo(() => {
    return getDisplayGroundStations(groundStations);
  }, [groundStations]);

  useEffect(() => {
    if (!selectedGroundStationId) {
      setGroundStationPos(null);
      return;
    }

    // Find ground station by ID (works for both API and predefined stations)
    const station = displayGroundStations.find(
      (gs: DisplayGroundStation) => gs.id === selectedGroundStationId
    );
    
    if (station) {
      // Use the standardized DisplayGroundStation format
      setGroundStationPos(Cartesian3.fromDegrees(
        station.longitude, 
        station.latitude, 
        station.altitude
      ));
    } else {
      setGroundStationPos(null);
    }
  }, [selectedGroundStationId, displayGroundStations]);

  return groundStationPos;
}