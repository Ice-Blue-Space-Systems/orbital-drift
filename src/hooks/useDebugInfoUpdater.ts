import { useEffect, useRef } from "react";
import { Cartesian3, JulianDate } from "cesium";
import { calculateVelocity } from "../utils/mathUtils";

type DebugInfoUpdaterProps = {
  viewerRef: React.MutableRefObject<any>;
  contactWindows: any[];
  selectedSatId: string | null;
  selectedGroundStationId: string | null;
  satPositionProperty: any;
  groundTrackPositionProperty: any;
  groundStationPos: Cartesian3 | null;
  setDebugInfo: React.Dispatch<
    React.SetStateAction<{
      satellitePosition: Cartesian3 | null;
      groundTrackPosition: Cartesian3 | null;
      currentTime: Date | null;
      inSight: boolean;
      groundStationPosition: Cartesian3 | null;
      satelliteVelocity: Cartesian3 | null;
    }>
  >;
};

export function useDebugInfoUpdater({
  viewerRef,
  contactWindows,
  selectedSatId,
  selectedGroundStationId,
  satPositionProperty,
  groundTrackPositionProperty,
  groundStationPos,
  setDebugInfo,
}: DebugInfoUpdaterProps) {
  const listenerRef = useRef<(() => void) | undefined>(undefined);

  useEffect(() => {
    const viewer = viewerRef.current?.cesiumElement;
    if (!viewer) return;

    // Remove existing listener if it exists
    if (listenerRef.current) {
      viewer.clock.onTick.removeEventListener(listenerRef.current);
      listenerRef.current = undefined;
    }

    // Only add debug listener if we have selections
    if (contactWindows && selectedSatId && selectedGroundStationId) {
      const updateDebugInfo = () => {
        const curTime = viewer.clock.currentTime;
        const dateObject = JulianDate.toDate(curTime);

        // Get current satellite position
        const currentPosition = satPositionProperty?.getValue(curTime);

        // Get previous satellite position (1 second earlier)
        const previousTime = JulianDate.addSeconds(curTime, -1, new JulianDate());
        const previousPosition = satPositionProperty?.getValue(previousTime);

        // Use the calculateVelocity utility function
        const satVelocity = calculateVelocity(
          currentPosition,
          previousPosition,
          curTime,
          previousTime
        );

        // Check if the satellite is in sight based on contact windows
        // Extract real MongoDB ObjectIds from synthetic IDs
        let realSatId = selectedSatId;
        let realGroundStationId = selectedGroundStationId;

        if (selectedSatId?.startsWith('api-')) {
          realSatId = selectedSatId.replace('api-', '');
        }
        if (selectedGroundStationId?.startsWith('api-')) {
          realGroundStationId = selectedGroundStationId.replace('api-', '');
        }

        // For predefined ground stations, there are no contact windows in the database
        const isPredefineGroundStation = selectedGroundStationId?.startsWith('predefined-');

        const currentContactWindow = !isPredefineGroundStation ? contactWindows.find(
          (win: {
            satelliteId: string;
            groundStationId: string;
            scheduledAOS: string | number | Date;
            scheduledLOS: string | number | Date;
          }) =>
            win.satelliteId === realSatId &&
            win.groundStationId === realGroundStationId &&
            new Date(win.scheduledAOS) <= dateObject &&
            new Date(win.scheduledLOS) >= dateObject
        ) : null;

        const inSight = !!currentContactWindow;

        setDebugInfo((prev) => ({
          ...prev,
          satellitePosition: currentPosition || null,
          groundTrackPosition:
            groundTrackPositionProperty?.getValue(curTime) || null,
          currentTime: dateObject,
          inSight,
          groundStationPosition: groundStationPos || null,
          satelliteVelocity: satVelocity || null,
        }));
      };

      listenerRef.current = updateDebugInfo;
      viewer.clock.onTick.addEventListener(listenerRef.current);
    }

    return () => {
      // Clean up when dependencies change
      if (listenerRef.current) {
        viewer.clock.onTick.removeEventListener(listenerRef.current);
      }
    };
  }, [
    viewerRef,
    contactWindows,
    selectedSatId,
    selectedGroundStationId,
    satPositionProperty,
    groundTrackPositionProperty,
    groundStationPos,
    setDebugInfo,
  ]);
}
