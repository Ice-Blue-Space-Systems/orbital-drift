import { useState, useEffect, useRef, useMemo } from "react";
import { Cartesian3, JulianDate, CallbackProperty } from "cesium";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "./store";
import { ContactWindow, fetchMongoData } from "./store/mongoSlice";
import { selectContactWindows } from "./store/contactWindowsSlice";
import CesiumViewer from "./components/CesiumViewer";
import GlobeTools from "./components/GlobeTools";
import { useLineOfSight } from "./hooks/useLineOfSight";
import { useSatellitePosition } from "./hooks/useSatellitePosition";
import { useTleTrackHistory } from "./hooks/useTleTrackHistory";
import { useGroundTrackHistory } from "./hooks/useGroundTrackHistory";
import { useTleTrackFuture } from "./hooks/useTleTrackFuture";
import { useFutureGroundTrack } from "./hooks/useFutureGroundTrack";
import { useGroundStationPosition } from "./hooks/useGroundStationPosition";

function GlobePage() {
  const dispatch: AppDispatch = useDispatch();
  const { satellites, groundStations, status } = useSelector(
    (state: RootState) => state.mongo
  );
  const contactWindows = useSelector(selectContactWindows);

  const selectedSatId = useSelector(
    (state: RootState) => state.mongo.selectedSatId
  );
  const selectedGroundStationId = useSelector(
    (state: RootState) => state.mongo.selectedGroundStationId
  );

  const viewerRef = useRef<any>(null);

  const { satPositionProperty, groundTrackPositionProperty } =
    useSatellitePosition(selectedSatId, satellites, viewerRef);

  const groundStationPos = useGroundStationPosition(
    selectedGroundStationId ?? null,
    groundStations
  );

  const showHistory = useSelector(
    (state: RootState) => state.mongo.showHistory
  );
  const showTle = useSelector((state: RootState) => state.mongo.showTle);
  const showGroundTrack = useSelector(
    (state: RootState) => state.mongo.showGroundTrack
  );

  type DebugInfo = {
    satellitePosition: Cartesian3 | null;
    tlePosition: Cartesian3 | null;
    groundTrackPosition: Cartesian3 | null;
    currentTime: Date | null;
    inSight: boolean;
    satelliteVelocity: Cartesian3 | null;
    dopplerShift: number | null;
    adjustedFrequency: number | null;
    groundStationPosition: Cartesian3 | null;
  };
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    satellitePosition: null,
    tlePosition: null,
    groundTrackPosition: null,
    currentTime: null,
    inSight: false,
    satelliteVelocity: null,
    dopplerShift: null,
    adjustedFrequency: null,
    groundStationPosition: null,
  });

  const tleHistoryRef = useTleTrackHistory(
    satPositionProperty,
    viewerRef,
    showTle,
    showHistory
  );
  const groundTrackHistoryRef = useGroundTrackHistory(
    groundTrackPositionProperty,
    viewerRef,
    showGroundTrack,
    showHistory
  );
  const lineOfSightPositionsRef = useRef<Cartesian3[]>([]);

  const tleFuture = useTleTrackFuture(satPositionProperty, viewerRef, showTle);

  const groundTrackFuture = useFutureGroundTrack(
    groundTrackPositionProperty,
    viewerRef,
    showGroundTrack
  );

  // Fetch initial data once
  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchMongoData());
    }
  }, [status, dispatch]);

  // Calculate the next contact window
  const nextContactWindow: ContactWindow | null = useMemo(() => {
    if (!selectedSatId || !selectedGroundStationId || !debugInfo.currentTime)
      return null;

    // Use debugInfo.currentTime directly as it is already a Date object
    const cesiumCurrentTime = debugInfo.currentTime;

    const futureWindows = contactWindows.filter(
      (win: ContactWindow) =>
        win.satelliteId === selectedSatId &&
        win.groundStationId === selectedGroundStationId &&
        new Date(win.scheduledLOS) > cesiumCurrentTime // Compare against Cesium clock time
    );

    if (!futureWindows.length) return null;

    // Sort by AOS and return the first one
    return futureWindows.sort(
      (a: ContactWindow, b: ContactWindow) =>
        new Date(a.scheduledAOS).getTime() - new Date(b.scheduledAOS).getTime()
    )[0];
  }, [
    contactWindows,
    selectedSatId,
    selectedGroundStationId,
    debugInfo.currentTime,
  ]);

  const nextAosLosLabel = useMemo(() => {
    if (!nextContactWindow) return "No upcoming contact";
    return (
      "Next AOS: " +
      new Date(nextContactWindow.scheduledAOS).toISOString() +
      "\nLOS: " +
      new Date(nextContactWindow.scheduledLOS).toISOString()
    );
  }, [nextContactWindow]);

  // Example of continuously updating debugInfo each frame for SatelliteStatusTable
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

      let satVelocity: Cartesian3 | null = null;

      if (currentPosition && previousPosition) {
        // Calculate velocity as the difference in position divided by time interval
        const deltaPosition = Cartesian3.subtract(
          currentPosition,
          previousPosition,
          new Cartesian3()
        );
        const deltaTime = JulianDate.secondsDifference(curTime, previousTime);

        satVelocity = Cartesian3.multiplyByScalar(
          deltaPosition,
          1 / deltaTime,
          new Cartesian3()
        ); // Velocity in meters per second
      }

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
    contactWindows,
    selectedSatId,
    selectedGroundStationId,
    satPositionProperty,
    groundTrackPositionProperty,
    groundStationPos,
  ]);

  // Cleanup on unmount: Destroy Cesium viewer
  useEffect(() => {
    const viewer = viewerRef.current?.cesiumElement;

    return () => {
      if (viewer) {
        viewer.destroy(); // Destroy the Cesium viewer
        console.log("Cesium viewer destroyed");
      }
    };
  }, []);

  // Call the useLineOfSight hook
  useLineOfSight(
    viewerRef,
    satPositionProperty,
    groundStationPos,
    lineOfSightPositionsRef
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 64px)",
      }}
    >
      {/* Our collapsible toolbox on the right (GlobeTools) */}
      <GlobeTools groundStations={groundStations} debugInfo={debugInfo} />

      {/* Main Cesium globe, stretched to fill the remaining space */}
      <div style={{ flex: 1, position: "relative" }}>
        <CesiumViewer
          viewerRef={viewerRef}
          lineOfSightPositions={lineOfSightPositionsRef.current}
          satPositionProperty={satPositionProperty}
          groundStationPos={groundStationPos}
          nextAosLosLabel={nextAosLosLabel}
          tleHistory={tleHistoryRef.current}
          tleFuture={
            tleFuture instanceof CallbackProperty
              ? tleFuture.getValue(JulianDate.now())
              : tleFuture || []
          }
          groundTrackHistory={groundTrackHistoryRef.current}
          groundTrackFuture={
            groundTrackFuture instanceof CallbackProperty
              ? groundTrackFuture.getValue(JulianDate.now())
              : []
          }
          visibilityConeEntities={[]}
        />
      </div>
    </div>
  );
}

export default GlobePage;
