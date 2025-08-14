import { useState, useEffect, useRef } from "react";
import { Cartesian3, JulianDate } from "cesium";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "./store";
import { fetchMongoData } from "./store/mongoSlice";
import { selectContactWindows } from "./store/contactWindowsSlice";
import CesiumViewer from "./components/CesiumViewer";
import GlobeTools from "./components/GlobeTools";
import UtcTimeWidget from "./components/UtcTimeWidget";
import { useLineOfSight } from "./hooks/useLineOfSight";
import { useSatellitePosition } from "./hooks/useSatellitePosition";
import { useTleTrackHistory } from "./hooks/useTleTrackHistory";
import { useGroundTrackHistory } from "./hooks/useGroundTrackHistory";
import { useTleTrackFuture } from "./hooks/useTleTrackFuture";
import { useFutureGroundTrack } from "./hooks/useFutureGroundTrack";
import { useGroundStationPosition } from "./hooks/useGroundStationPosition";
import { useDebugInfoUpdater } from "./hooks/useDebugInfoUpdater";
import { useCesiumClock } from "./hooks/useCesiumClock";
import { useNextContactWindow } from "./hooks/useNextContactWindow";
import { DebugInfo } from "./types";
import { resolveCallbackProperty } from "./utils/cesiumUtils";
import { useRoutePerformance } from "./utils/performanceUtils";

const GlobePage: React.FC = () => {
  // Add performance monitoring
  useRoutePerformance('globe');

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

  // Single source of truth for Cesium clock
  useCesiumClock(viewerRef);

  // Get current Redux state
  const cesiumMultiplier = useSelector((state: RootState) => state.cesiumClock.multiplier);
  const cesiumClockTime = useSelector((state: RootState) => state.cesiumClock.iso);

  // Sync Redux state to Cesium when Globe page loads
  useEffect(() => {
    const viewer = viewerRef.current?.cesiumElement;
    if (!viewer) {
      console.log("GlobePage: No viewer available yet for initialization");
      return;
    }

    console.log(`GlobePage: Initializing with Redux state - Time: ${cesiumClockTime}, Multiplier: ${cesiumMultiplier}x`);

    const timeout = setTimeout(() => {
      // Set Cesium time to match Redux time (preserves Timeline → Globe continuity)
      if (cesiumClockTime) {
        const targetTime = new Date(cesiumClockTime);
        const cesiumTime = JulianDate.fromDate(targetTime);
        viewer.clock.currentTime = cesiumTime;
        console.log(`GlobePage: Set Cesium time to ${targetTime.toISOString()}`);
      }

      // Set Cesium multiplier to match Redux multiplier
      const currentMultiplier = viewer.clock.multiplier;
      if (currentMultiplier !== cesiumMultiplier) {
        viewer.clock.multiplier = cesiumMultiplier;
        console.log(`GlobePage: Set Cesium speed from ${currentMultiplier}x to ${cesiumMultiplier}x`);
      } else {
        console.log(`GlobePage: Cesium speed already at ${cesiumMultiplier}x`);
      }
    }, 200); // Increased delay to ensure viewer is fully ready

    return () => clearTimeout(timeout);
  }, [cesiumMultiplier, cesiumClockTime]); // Removed viewerRef dependency to avoid unnecessary re-runs

  // Sync Redux state to Cesium when viewer becomes available
  useEffect(() => {
    const viewer = viewerRef.current?.cesiumElement;
    if (!viewer) return;

    console.log(`GlobePage: Viewer became available, syncing state - Time: ${cesiumClockTime}, Multiplier: ${cesiumMultiplier}x`);

    // Set Cesium time to match Redux time
    if (cesiumClockTime) {
      const targetTime = new Date(cesiumClockTime);
      const cesiumTime = JulianDate.fromDate(targetTime);
      viewer.clock.currentTime = cesiumTime;
      console.log(`GlobePage: Set Cesium time to ${targetTime.toISOString()}`);
    }

    // Set Cesium multiplier to match Redux multiplier
    const currentMultiplier = viewer.clock.multiplier;
    if (currentMultiplier !== cesiumMultiplier) {
      viewer.clock.multiplier = cesiumMultiplier;
      console.log(`GlobePage: Set Cesium speed from ${currentMultiplier}x to ${cesiumMultiplier}x`);
    } else {
      console.log(`GlobePage: Cesium speed already at ${cesiumMultiplier}x`);
    }
  }, [viewerRef.current?.cesiumElement, cesiumClockTime, cesiumMultiplier]); // Trigger when viewer becomes available or state changes

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

  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    satellitePosition: null,
    groundTrackPosition: null,
    currentTime: null,
    inSight: false,
    groundStationPosition: null,
    satelliteVelocity: null,
  });

  // Use the custom hook for updating debug info
  useDebugInfoUpdater({
    viewerRef,
    contactWindows,
    selectedSatId,
    selectedGroundStationId,
    satPositionProperty,
    groundTrackPositionProperty,
    groundStationPos,
    setDebugInfo,
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

  const { nextAosLosLabel } = useNextContactWindow({
    contactWindows,
    selectedSatId,
    selectedGroundStationId,
    currentTime: debugInfo.currentTime,
  });

  // Cleanup on unmount: Destroy Cesium viewer
  useEffect(() => {
    const currentViewerRef = viewerRef.current;
    
    return () => {
      const viewer = currentViewerRef?.cesiumElement;
      if (viewer && !viewer.isDestroyed()) {
        try {
          // Give time for any pending operations to complete
          setTimeout(() => {
            if (!viewer.isDestroyed()) {
              viewer.destroy();
              console.log("Cesium viewer destroyed");
            }
          }, 100);
        } catch (error) {
          console.warn("Error destroying Cesium viewer:", error);
        }
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
        height: "100vh",
      }}
    >
      {/* UTC Time Widget - Top Center */}
      <UtcTimeWidget position="top-center" />

      {/* Globe Tools - Top Left (position will be set via CSS) */}
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
          tleFuture={resolveCallbackProperty(tleFuture)} // Cleaned up logic
          groundTrackHistory={groundTrackHistoryRef.current}
          groundTrackFuture={resolveCallbackProperty(groundTrackFuture)} // Cleaned up logic
          visibilityConeEntities={[]}
        />
      </div>
    </div>
  );
}

export default GlobePage;
