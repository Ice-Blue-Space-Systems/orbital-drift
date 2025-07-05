import { useEffect } from "react";
import { Cartesian3, JulianDate } from "cesium";
import { calculateVelocity } from "../utils/mathUtils";

type DebugInfoUpdaterProps = {
  viewerRef: React.MutableRefObject<any>;
  contactWindows: any[];
  selectedSatId: string | null;
  selectedGroundStationId: any;
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
  useEffect(() => {
    if (
      !viewerRef.current?.cesiumElement ||
      !contactWindows ||
      !selectedSatId ||
      !selectedGroundStationId
    )
      return;

    const viewer = viewerRef.current.cesiumElement;

    const updateDebugInfo = () => {
      const curTime = viewer.clock.currentTime;

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
      const currentContactWindow = contactWindows.find(
        (win: {
          satelliteId: string;
          groundStationId: string;
          scheduledAOS: string | number | Date;
          scheduledLOS: string | number | Date;
        }) =>
          win.satelliteId === selectedSatId &&
          win.groundStationId === selectedGroundStationId &&
          new Date(win.scheduledAOS) <= JulianDate.toDate(curTime) &&
          new Date(win.scheduledLOS) >= JulianDate.toDate(curTime)
      );

      const inSight = !!currentContactWindow; // True if a valid contact window exists

      setDebugInfo((prev) => ({
        ...prev,
        satellitePosition: currentPosition || null,
        groundTrackPosition:
          groundTrackPositionProperty?.getValue(curTime) || null,
        currentTime: JulianDate.toDate(curTime),
        inSight,
        groundStationPosition: groundStationPos || null,
        satelliteVelocity: satVelocity || null, // Add calculated velocity to debugInfo
      }));
    };

    viewer.clock.onTick.addEventListener(updateDebugInfo);
    return () => viewer.clock.onTick.removeEventListener(updateDebugInfo);
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