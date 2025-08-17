import { useState, useEffect, useRef, useMemo } from "react";
import { Cartesian3, JulianDate } from "cesium";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "./store";
import { fetchMongoData } from "./store/mongoSlice";
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
import { useDebugInfoUpdater } from "./hooks/useDebugInfoUpdater";
import { useCesiumClock } from "./hooks/useCesiumClock";
import { useNextContactWindow } from "./hooks/useNextContactWindow";
import { DebugInfo } from "./types";
import { resolveCallbackProperty } from "./utils/cesiumUtils";
import { useRoutePerformance } from "./utils/performanceUtils";

const GlobePage: React.FC = (): React.ReactElement => {
  // Add performance monitoring
  useRoutePerformance('globe');

  const dispatch: AppDispatch = useDispatch();
  const { 
    satellites, 
    groundStations, 
    status,
    tleHistoryDuration,
    tleFutureDuration,
    showTle,
    showHistory,
    showGroundTrack
  } = useSelector((state: RootState) => state.mongo);
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

  // State for debug info display
  const [debugInfo, setDebugInfo] = useState<{
    satellitePosition: Cartesian3 | null;
    groundTrackPosition: Cartesian3 | null;
    currentTime: Date | null;
    inSight: boolean;
    groundStationPosition: Cartesian3 | null;
    satelliteVelocity: Cartesian3 | null;
  }>({
    satellitePosition: null,
    groundTrackPosition: null,
    currentTime: new Date(),
    inSight: false,
    groundStationPosition: null,
    satelliteVelocity: null,
  });

  // Get satellite position property
  const { satPositionProperty, groundTrackPositionProperty } = useSatellitePosition(selectedSatId, satellites, viewerRef);

  // Ground station position
  const groundStationPos = useGroundStationPosition(selectedGroundStationId, groundStations);

  // Debug info updater - Update debug info based on satellite position and current time
  useDebugInfoUpdater({
    viewerRef,
    selectedSatId,
    selectedGroundStationId,
    satPositionProperty,
    groundTrackPositionProperty,
    groundStationPos,
    contactWindows,
    setDebugInfo,
  });

  // TLE track hooks with configurable durations
  const tleHistory = useTleTrackHistory(
    satPositionProperty,
    viewerRef,
    showTle,
    showHistory,
    tleHistoryDuration
  );

  const tleFuture = useTleTrackFuture(
    satPositionProperty, 
    viewerRef, 
    showTle, 
    tleFutureDuration
  );

  const groundTrackHistoryRef = useGroundTrackHistory(
    groundTrackPositionProperty,
    viewerRef,
    showGroundTrack,
    showHistory
  );
  
  // State for line of sight positions to prevent unnecessary re-renders
  const [lineOfSightPositions, setLineOfSightPositions] = useState<Cartesian3[]>([]);

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
    setLineOfSightPositions
  );

  // Memoize resolved properties to prevent unnecessary re-renders  
  const memoizedGroundTrackFuture = useMemo(() => {
    return resolveCallbackProperty(groundTrackFuture);
  }, [groundTrackFuture]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
      }}
    >
      {/* Globe Tools - Top Left (position will be set via CSS) */}
      <GlobeTools groundStations={groundStations} debugInfo={debugInfo} />

      {/* Main Cesium globe, stretched to fill the remaining space */}
      <div style={{ flex: 1, position: "relative" }}>
        <CesiumViewer
          viewerRef={viewerRef}
          lineOfSightPositions={lineOfSightPositions}
          satPositionProperty={satPositionProperty}
          groundStationPos={groundStationPos}
          nextAosLosLabel={nextAosLosLabel}
          tleHistory={tleHistory}
          tleFuture={tleFuture}
          groundTrackHistory={groundTrackHistoryRef.current}
          groundTrackFuture={memoizedGroundTrackFuture}
        />
      </div>
    </div>
  );
};

export default GlobePage;
