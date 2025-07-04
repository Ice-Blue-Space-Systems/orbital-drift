import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Cartesian3,
  JulianDate,
  SampledPositionProperty,
  CallbackProperty,
  Ellipsoid,
} from "cesium";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "./store";
import { ContactWindow, fetchMongoData } from "./store/mongoSlice";
import { fetchTleBySatelliteId } from "./store/tleSlice";
import { selectContactWindows } from "./store/contactWindowsSlice";
import CesiumViewer from "./components/CesiumViewer";
import {
  getFuturePositionsWithTime,
} from "./utils/tleUtils";
import GlobeTools from "./components/GlobeTools";

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

  const [satPositionProperty, setSatPositionProperty] =
    useState<SampledPositionProperty | null>(null);
  
    const[groundTrackPositionProperty, setGroundTrackPositionProperty] =
    useState<SampledPositionProperty | null>(null);
  const [groundStationPos, setGroundStationPos] = useState<Cartesian3 | null>(
    null
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

  const viewerRef = useRef<any>(null);
  const tleHistoryRef = useRef<Cartesian3[]>([]);
  const groundTrackHistoryRef = useRef<Cartesian3[]>([]);
  const lineOfSightPositionsRef = useRef<Cartesian3[]>([]); // Use a ref for line-of-sight positions

  // Fetch initial data once
  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchMongoData());
    }
  }, [status, dispatch]);

  // Load TLE for satellite
  useEffect(() => {
    const satellite = satellites.find((sat) => sat._id === selectedSatId);
    if (!satellite) {
      setSatPositionProperty(null);
      return;
    }

    const loadTleAndPosition = async () => {
      try {
        let line1 = "";
        let line2 = "";

        if (satellite.type === "simulated" && satellite.currentTleId) {
          const tle = await dispatch(fetchTleBySatelliteId(satellite.currentTleId)).unwrap();
          line1 = tle.line1;
          line2 = tle.line2;
        } else if (satellite.type === "live" && satellite.noradId) {
          const res = await fetch("https://celestrak.com/NORAD/elements/stations.txt");
          const lines = (await res.text()).split("\n");
          const idx = lines.findIndex((l) => l.includes(String(satellite.noradId)));
          if (idx !== -1) {
            line1 = lines[idx];
            line2 = lines[idx + 1];
          }
        }

        if (line1 && line2) {
          const positionProperty = getFuturePositionsWithTime(
            line1,
            line2,
            1060,
            viewerRef.current?.cesiumElement?.clock
          );

          const groundTrackProperty = getFuturePositionsWithTime(
            line1,
            line2,
            1060,
            viewerRef.current?.cesiumElement?.clock
          );

          setSatPositionProperty(positionProperty);
          setGroundTrackPositionProperty(groundTrackProperty); // Set groundTrackPositionProperty
        } else {
          setSatPositionProperty(null);
          setGroundTrackPositionProperty(null); // Reset groundTrackPositionProperty
        }
      } catch (err) {
        console.error("Failed to fetch TLE or compute position", err);
        setSatPositionProperty(null);
        setGroundTrackPositionProperty(null); // Reset groundTrackPositionProperty on error
      }
    };

    if (selectedSatId) {
      loadTleAndPosition();
    }
  }, [selectedSatId, satellites, dispatch]);

  // Convert ground station location
  useEffect(() => {
    const station = groundStations.find(
      (gs) => gs._id === selectedGroundStationId
    );
    if (station) {
      const { lat, lon, alt } = station.location;
      setGroundStationPos(Cartesian3.fromDegrees(lon, lat, alt * 1000));
    } else {
      setGroundStationPos(null);
    }
  }, [selectedGroundStationId, groundStations]);

  // Update line-of-sight (positions) each frame
  useEffect(() => {
    if (satPositionProperty && groundStationPos) {
      const viewer = viewerRef.current?.cesiumElement;
      if (!viewer) return;

      const { clock } = viewer;
      const onTick = () => {
        const time = clock.currentTime;
        const satPos = satPositionProperty.getValue(time);
        if (satPos) {
          const positions = [groundStationPos, satPos];
          lineOfSightPositionsRef.current = positions;
        }
      };

      clock.onTick.addEventListener(onTick);
      return () => clock.onTick.removeEventListener(onTick);
    }
  }, [satPositionProperty, groundStationPos]);

  // Ground Track (past)
  useEffect(() => {
    if (
      !showGroundTrack ||
      !showHistory ||
      !groundTrackPositionProperty ||
      !viewerRef.current
    ) {
      return;
    }
    const viewer = viewerRef.current.cesiumElement;

    const recordGroundTrack = () => {
      const now = viewer.clock.currentTime;
      if (!now) return;
      const pos = groundTrackPositionProperty.getValue(now);
      if (pos) {
        const carto = Ellipsoid.WGS84.cartesianToCartographic(pos);
        carto.height = 0;
        groundTrackHistoryRef.current.push(
          Ellipsoid.WGS84.cartographicToCartesian(carto)
        );
      }
    };

    viewer.clock.onTick.addEventListener(recordGroundTrack);
    return () => viewer.clock.onTick.removeEventListener(recordGroundTrack);
  }, [showGroundTrack, showHistory, groundTrackPositionProperty, satPositionProperty]);

  // Future ground track
  const groundTrackHistory = useMemo(() => {
    return new CallbackProperty(() => groundTrackHistoryRef.current, false);
  }, []);
  const groundTrackFuture = useMemo(() => {
    if (!showGroundTrack || !groundTrackPositionProperty) return null;
    return new CallbackProperty(() => {
      const future: Cartesian3[] = [];
      const viewer = viewerRef.current?.cesiumElement;
      if (!viewer) return future;

      const now = viewer.clock.currentTime;
      if (!now) return future;

      for (let i = 0; i <= 3600; i += 30) {
        const offsetTime = JulianDate.addSeconds(now, i, new JulianDate());
        const pos = groundTrackPositionProperty.getValue(offsetTime);
        if (pos) {
          const carto = Ellipsoid.WGS84.cartesianToCartographic(pos);
          carto.height = 0;
          future.push(Ellipsoid.WGS84.cartographicToCartesian(carto));
        }
      }
      return future;
    }, false);
  }, [showGroundTrack, groundTrackPositionProperty]);

  // TLE track (future)
  const tleFuture = useMemo(() => {
    if (!showTle || !satPositionProperty) return null;
    return new CallbackProperty(() => {
      const positions: Cartesian3[] = [];
      const viewer = viewerRef.current?.cesiumElement;
      if (!viewer) return positions;

      const currentTime = viewer.clock.currentTime;
      if (!currentTime) return positions;

      for (let i = 0; i <= 3600; i += 30) {
        const offsetTime = JulianDate.addSeconds(
          currentTime,
          i,
          new JulianDate()
        );
        const pos = satPositionProperty.getValue(offsetTime);
        if (pos) positions.push(pos);
      }
      return positions;
    }, false);
  }, [showTle, satPositionProperty]);

  // TLE track (past)
  useEffect(() => {
    if (!showTle || !satPositionProperty || !viewerRef.current) return;
    const viewer = viewerRef.current.cesiumElement;

    const recordTleTrack = () => {
      const now = viewer.clock.currentTime;
      if (!now) return;
      const pos = satPositionProperty.getValue(now);
      if (pos) {
        if (showHistory) {
          tleHistoryRef.current.push(pos);
        } else {
          tleHistoryRef.current.length = 0;
          tleHistoryRef.current.push(pos);
        }
      }
    };

    viewer.clock.onTick.addEventListener(recordTleTrack);
    return () => viewer.clock.onTick.removeEventListener(recordTleTrack);
  }, [showTle, showHistory, satPositionProperty]);

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
    groundStationPos
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

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 64px)",
      }}
    >
      {/* Our collapsible toolbox on the right (GlobeTools) */}
      <GlobeTools
        groundStations={groundStations}
        debugInfo={debugInfo}
      />

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
          groundTrackHistory={groundTrackHistory.getValue(JulianDate.now())}
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
