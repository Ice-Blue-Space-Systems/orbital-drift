// filepath: /Users/chrischeshire/Documents/IceBlue/hello-world-react-app/src/hooks/useSatellitePosition.ts
import { useEffect, useState } from "react";
import { SampledPositionProperty } from "cesium";
import { useDispatch } from "react-redux";
import { loadTleAndPosition } from "../utils/tleUtils";
import { AppDispatch } from "../store";

export function useSatellitePosition(
  selectedSatId: string | null,
  satellites: any[],
  viewerRef: React.MutableRefObject<any>
): {
  satPositionProperty: SampledPositionProperty | null;
  groundTrackPositionProperty: SampledPositionProperty | null;
} {
  const dispatch: AppDispatch = useDispatch();
  const [satPositionProperty, setSatPositionProperty] =
    useState<SampledPositionProperty | null>(null);
  const [groundTrackPositionProperty, setGroundTrackPositionProperty] =
    useState<SampledPositionProperty | null>(null);

  useEffect(() => {
    const satellite = satellites.find((sat) => sat._id === selectedSatId);
    if (!satellite) {
      setSatPositionProperty(null);
      setGroundTrackPositionProperty(null);
      return;
    }

    const fetchPositions = async () => {
      // Wait for viewer to be available
      if (!viewerRef.current?.cesiumElement?.clock) {
        // If viewer isn't ready yet, try again in the next tick
        setTimeout(fetchPositions, 10);
        return;
      }

      const { satPositionProperty, groundTrackPositionProperty } = await loadTleAndPosition(
        satellite,
        dispatch,
        viewerRef.current.cesiumElement.clock
      );

      setSatPositionProperty(satPositionProperty);
      setGroundTrackPositionProperty(groundTrackPositionProperty);
    };

    if (selectedSatId) {
      fetchPositions();
    }
  }, [selectedSatId, satellites, dispatch, viewerRef]);

  return { satPositionProperty, groundTrackPositionProperty };
}