import { useEffect, useState, useMemo, useRef } from "react";
import { SampledPositionProperty, CallbackProperty } from "cesium";
import { useDispatch } from "react-redux";
import { loadTleAndPosition } from "../utils/tleUtils";
import { AppDispatch } from "../store";

export function useSatellitePosition(
  selectedSatId: string | null,
  satellites: any[],
  viewerRef: React.MutableRefObject<any>
): {
  satPositionProperty: SampledPositionProperty | CallbackProperty | null;
  groundTrackPositionProperty: SampledPositionProperty | CallbackProperty | null;
} {
  const dispatch: AppDispatch = useDispatch();
  const [satPositionProperty, setSatPositionProperty] =
    useState<SampledPositionProperty | CallbackProperty | null>(null);
  const [groundTrackPositionProperty, setGroundTrackPositionProperty] =
    useState<SampledPositionProperty | CallbackProperty | null>(null);

  // Track the last processed satellite to prevent unnecessary re-processing
  const lastProcessedSatIdRef = useRef<string | null>(null);
  const lastProcessedSatelliteRef = useRef<any>(null);

  // Memoize only the selected satellite data we need, with stable reference
  const selectedSatellite = useMemo(() => {
    if (!selectedSatId) return null;
    
    // If same satellite ID and we have a cached satellite, return it
    if (selectedSatId === lastProcessedSatIdRef.current && lastProcessedSatelliteRef.current) {
      return lastProcessedSatelliteRef.current;
    }
    
    const satellite = satellites.find((sat) => sat._id === selectedSatId);
    if (!satellite) return null;
    
    // Return a stable object with only the fields we need
    const stableSatellite = {
      _id: satellite._id,
      name: satellite.name,
      currentTleId: satellite.currentTleId,
      tle: satellite.tle
    };
    
    // Cache it
    lastProcessedSatelliteRef.current = stableSatellite;
    
    return stableSatellite;
  }, [selectedSatId, satellites]);

  useEffect(() => {
    // Skip if satellite ID hasn't changed
    if (lastProcessedSatIdRef.current === selectedSatId) {
      console.log("useSatellitePosition: Skipping - same satellite ID already processed:", selectedSatId);
      return;
    }

    console.log("useSatellitePosition: Processing new satellite ID:", selectedSatId, "previous:", lastProcessedSatIdRef.current);
    
    if (!selectedSatellite) {
      console.log("useSatellitePosition: No satellite found for ID:", selectedSatId);
      setSatPositionProperty(null);
      setGroundTrackPositionProperty(null);
      lastProcessedSatIdRef.current = selectedSatId;
      return;
    }

    console.log("useSatellitePosition: Found satellite:", selectedSatellite.name);

    const fetchPositions = async () => {
      // Wait for viewer to be available
      if (!viewerRef.current?.cesiumElement?.clock) {
        console.log("useSatellitePosition: Viewer not ready yet, retrying...");
        // If viewer isn't ready yet, try again in the next tick
        setTimeout(fetchPositions, 100);
        return;
      }

      console.log("useSatellitePosition: Calling loadTleAndPosition for:", selectedSatellite.name);
      const { satPositionProperty, groundTrackPositionProperty } = await loadTleAndPosition(
        selectedSatellite,
        dispatch,
        viewerRef.current.cesiumElement.clock
      );

      console.log("useSatellitePosition: Received position properties for:", selectedSatellite.name, { 
        satPositionProperty: !!satPositionProperty, 
        groundTrackPositionProperty: !!groundTrackPositionProperty 
      });

      setSatPositionProperty(satPositionProperty);
      setGroundTrackPositionProperty(groundTrackPositionProperty);
      lastProcessedSatIdRef.current = selectedSatId;
    };

    if (selectedSatId && selectedSatellite) {
      fetchPositions();
    }
  }, [selectedSatId, selectedSatellite, dispatch, viewerRef]); // Include selectedSatellite and viewerRef to satisfy eslint

  return { satPositionProperty, groundTrackPositionProperty };
}