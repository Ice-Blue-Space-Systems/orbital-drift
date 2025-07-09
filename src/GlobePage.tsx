import { useState, useEffect, useRef } from "react";
import { Cartesian3 } from "cesium";
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

  // Single source of truth for Cesium clock time
  useCesiumClock(viewerRef);

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
