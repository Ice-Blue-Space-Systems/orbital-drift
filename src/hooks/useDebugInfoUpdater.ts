import { useEffect, useRef } from "react";
import { Cartesian3, JulianDate } from "cesium";
import { calculateVelocity } from "../utils/mathUtils";
import { setCesiumClockTime } from "../store/cesiumClockSlice";
import { useDispatch } from "react-redux";

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
  const dispatch = useDispatch();
  const listenerRef = useRef<(() => void) | undefined>(undefined); // Store the listener for clean detachment

  useEffect(() => {
    const viewer = viewerRef.current?.cesiumElement;

    if (!viewer) return;

    const updateDebugInfo = () => {
      const curTime = viewer.clock.currentTime;
      const dateObject = JulianDate.toDate(curTime);

      // Dispatch the ISO string to Redux (always dispatch time)
      dispatch(setCesiumClockTime(dateObject.toISOString()));

      // Only proceed with the rest of the logic if the conditions are met
      if (!contactWindows || !selectedSatId || !selectedGroundStationId) {
        return;
      }

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
          new Date(win.scheduledAOS) <= dateObject &&
          new Date(win.scheduledLOS) >= dateObject
      );

      const inSight = !!currentContactWindow; // True if a valid contact window exists

      setDebugInfo((prev) => ({
        ...prev,
        satellitePosition: currentPosition || null,
        groundTrackPosition:
          groundTrackPositionProperty?.getValue(curTime) || null,
        currentTime: dateObject,
        inSight,
        groundStationPosition: groundStationPos || null,
        satelliteVelocity: satVelocity || null, // Add calculated velocity to debugInfo
      }));
    };

    // Attach the listener and save it in the ref
    listenerRef.current = updateDebugInfo;
    viewer.clock.onTick.addEventListener(listenerRef.current);

    return () => {
      // Clean up the listener on unmount
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
    dispatch,
  ]);

  // Update the listener logic when dependencies change without re-attaching
  useEffect(() => {
    listenerRef.current = () => {
      const viewer = viewerRef.current?.cesiumElement;
      if (!viewer) return;

      const curTime = viewer.clock.currentTime;
      const dateObject = JulianDate.toDate(curTime);

      // Dispatch the ISO string to Redux
      dispatch(setCesiumClockTime(dateObject.toISOString()));

      if (!contactWindows || !selectedSatId || !selectedGroundStationId) return;

      const currentPosition = satPositionProperty?.getValue(curTime);
      const previousTime = JulianDate.addSeconds(curTime, -1, new JulianDate());
      const previousPosition = satPositionProperty?.getValue(previousTime);

      const satVelocity = calculateVelocity(
        currentPosition,
        previousPosition,
        curTime,
        previousTime
      );

      const currentContactWindow = contactWindows.find(
        (win: {
          satelliteId: string;
          groundStationId: string;
          scheduledAOS: string | number | Date;
          scheduledLOS: string | number | Date;
        }) =>
          win.satelliteId === selectedSatId &&
          win.groundStationId === selectedGroundStationId &&
          new Date(win.scheduledAOS) <= dateObject &&
          new Date(win.scheduledLOS) >= dateObject
      );

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
  }, [
    viewerRef,
    contactWindows,
    selectedSatId,
    selectedGroundStationId,
    satPositionProperty,
    groundTrackPositionProperty,
    groundStationPos,
    setDebugInfo,
    dispatch,
  ]);
}
