import { useSelector } from "react-redux";
import { RootState } from "../store";

/**
 * Shared hook for getting selected satellite and ground station data
 * Used by both GlobeTools and TimelineTools to avoid duplication
 */
export const useSelectedEntities = () => {
  const selectedSatelliteId = useSelector(
    (state: RootState) => state.mongo.selectedSatId
  );
  const selectedGroundStationId = useSelector(
    (state: RootState) => state.mongo.selectedGroundStationId
  );

  // Get satellites and ground stations data to find names
  const { satellites, groundStations } = useSelector((state: RootState) => state.mongo);
  
  // Find the selected satellite and ground station objects
  const selectedSatellite = satellites.find((sat: any) => sat._id === selectedSatelliteId);
  const selectedGroundStation = groundStations.find((gs: any) => gs._id === selectedGroundStationId);

  return {
    selectedSatelliteId,
    selectedGroundStationId,
    selectedSatellite,
    selectedGroundStation,
    satellites,
    groundStations,
  };
};
