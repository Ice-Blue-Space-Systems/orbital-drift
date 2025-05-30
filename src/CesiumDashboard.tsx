import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Cartesian3,
  JulianDate,
  SampledPositionProperty,
  CallbackProperty,
  Ellipsoid,
} from 'cesium';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from './store';
import { ContactWindow, fetchMongoData } from './store/mongoSlice';
import { fetchTleBySatelliteId } from './store/tleSlice';
import { selectContactWindows } from './store/contactWindowsSlice';
import CesiumViewer from './components/CesiumViewer';
import { getFuturePositionsWithTime } from './utils/tleUtils';
import GlobeTools from './components/GlobeTools';

interface CesiumDashboardProps {
  showCesiumOptions: boolean;
  setShowCesiumOptions: (value: boolean) => void;
}

function CesiumDashboard({
  showCesiumOptions,
  setShowCesiumOptions,
}: CesiumDashboardProps) {
  const dispatch: AppDispatch = useDispatch();
  const { satellites, groundStations, status } = useSelector((state: RootState) => state.mongo);
  const contactWindows = useSelector(selectContactWindows);

  const [selectedSatId, setSelectedSatId] = useState('');
  const [selectedGroundStationId, setSelectedGroundStationId] = useState('');
  const [showTle, setShowTle] = useState(false);
  const [showLineOfSight, setShowLineOfSight] = useState(false);
  const [showGroundTrack, setShowGroundTrack] = useState(false);
  const [satPositionProperty, setSatPositionProperty] = useState<SampledPositionProperty | null>(
    null
  );
  const [groundStationPos, setGroundStationPos] = useState<Cartesian3 | null>(null);
  const [lineOfSightPositions, setLineOfSightPositions] = useState<Cartesian3[]>([]);
  const [showVisibilityCones, setShowVisibilityCones] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  type DebugInfo = {
    satellitePosition: Cartesian3 | null;
    tlePosition: Cartesian3 | null;
    groundTrackPosition: Cartesian3 | null;
    currentTime: Date | null;
    inSight: boolean;
  };
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    satellitePosition: null,
    tlePosition: null,
    groundTrackPosition: null,
    currentTime: null,
    inSight: false,
  });

  const viewerRef = useRef<any>(null);
  const tleHistoryRef = useRef<Cartesian3[]>([]);
  const groundTrackHistoryRef = useRef<Cartesian3[]>([]);

  // Fetch initial data once
  useEffect(() => {
    if (status === 'idle') {
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
        let line1 = '';
        let line2 = '';

        if (satellite.type === 'simulated' && satellite.currentTleId) {
          const tle = await dispatch(
            fetchTleBySatelliteId(satellite.currentTleId)
          ).unwrap();
          line1 = tle.line1;
          line2 = tle.line2;
        } else if (satellite.type === 'live' && satellite.noradId) {
          const res = await fetch(
            'https://celestrak.com/NORAD/elements/stations.txt'
          );
          const lines = (await res.text()).split('\n');
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
          setSatPositionProperty(positionProperty);
        } else {
          setSatPositionProperty(null);
        }
      } catch (err) {
        console.error('Failed to fetch TLE or compute position', err);
        setSatPositionProperty(null);
      }
    };

    if (selectedSatId) {
      loadTleAndPosition();
    }
  }, [selectedSatId, satellites, dispatch]);

  // Convert ground station location
  useEffect(() => {
    const station = groundStations.find((gs) => gs._id === selectedGroundStationId);
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
          setLineOfSightPositions([groundStationPos, satPos]);
        }
      };
      clock.onTick.addEventListener(onTick);
      return () => clock.onTick.removeEventListener(onTick);
    }
  }, [satPositionProperty, groundStationPos]);

  // Ground Track (past)
  useEffect(() => {
    if (!showGroundTrack || !showHistory || !satPositionProperty || !viewerRef.current) {
      return;
    }
    const viewer = viewerRef.current.cesiumElement;

    const recordGroundTrack = () => {
      const now = viewer.clock.currentTime;
      if (!now) return;
      const pos = satPositionProperty.getValue(now);
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
  }, [showGroundTrack, showHistory, satPositionProperty]);

  // Future ground track
  const groundTrackHistory = useMemo(() => {
    return new CallbackProperty(() => groundTrackHistoryRef.current, false);
  }, []);
  const groundTrackFuture = useMemo(() => {
    if (!showGroundTrack || !satPositionProperty) return null;
    return new CallbackProperty(() => {
      const future: Cartesian3[] = [];
      const viewer = viewerRef.current?.cesiumElement;
      if (!viewer) return future;

      const now = viewer.clock.currentTime;
      if (!now) return future;

      for (let i = 0; i <= 3600; i += 30) {
        const offsetTime = JulianDate.addSeconds(now, i, new JulianDate());
        const pos = satPositionProperty.getValue(offsetTime);
        if (pos) {
          const carto = Ellipsoid.WGS84.cartesianToCartographic(pos);
          carto.height = 0;
          future.push(Ellipsoid.WGS84.cartographicToCartesian(carto));
        }
      }
      return future;
    }, false);
  }, [showGroundTrack, satPositionProperty]);

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
        const offsetTime = JulianDate.addSeconds(currentTime, i, new JulianDate());
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

  // Next contact window
  const nextContactWindow = useMemo(() => {
    if (!selectedSatId || !selectedGroundStationId) return null;
    const now = new Date();
    const futureWindows = contactWindows.filter(
      (win: ContactWindow) =>
        win.satelliteId === selectedSatId &&
        win.groundStationId === selectedGroundStationId &&
        new Date(win.scheduledLOS) > now
    );
    if (!futureWindows.length) return null;
    futureWindows.sort(
      (a: ContactWindow, b: ContactWindow) =>
        new Date(a.scheduledAOS).getTime() - new Date(b.scheduledAOS).getTime()
    );
    return futureWindows[0];
  }, [contactWindows, selectedSatId, selectedGroundStationId]);

  const nextAosLosLabel = useMemo(() => {
    if (!nextContactWindow) return 'No upcoming contact';
    return (
      'Next AOS: ' +
      new Date(nextContactWindow.scheduledAOS).toISOString() +
      '\nLOS: ' +
      new Date(nextContactWindow.scheduledLOS).toISOString()
    );
  }, [nextContactWindow]);

  // Example of continuously updating debugInfo each frame for SatelliteStatusTable
  useEffect(() => {
    if (!viewerRef.current?.cesiumElement || !satPositionProperty) return;
    const viewer = viewerRef.current.cesiumElement;

    const updateDebugInfo = () => {
      const curTime = viewer.clock.currentTime;
      const satPos = satPositionProperty.getValue(curTime) || null;
      // For demo, we assume no specialized inSight check—just false
      setDebugInfo((prev) => ({
        ...prev,
        satellitePosition: satPos,
        currentTime: JulianDate.toDate(curTime),
      }));
    };

    viewer.clock.onTick.addEventListener(updateDebugInfo);
    return () => viewer.clock.onTick.removeEventListener(updateDebugInfo);
  }, [satPositionProperty]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)' }}>

      {/* Our collapsible toolbox on the right (GlobeTools) */}
      <GlobeTools
        groundStations={groundStations}
        satellites={satellites}
        selectedGroundStationId={selectedGroundStationId}
        selectedSatId={selectedSatId}
        setSelectedGroundStationId={setSelectedGroundStationId}
        setSelectedSatId={setSelectedSatId}
        showHistory={showHistory}
        setShowHistory={setShowHistory}
        showTle={showTle}
        setShowTle={setShowTle}
        showLineOfSight={showLineOfSight}
        setShowLineOfSight={setShowLineOfSight}
        showVisibilityCones={showVisibilityCones}
        setShowVisibilityCones={setShowVisibilityCones}
        showGroundTrack={showGroundTrack}
        setShowGroundTrack={setShowGroundTrack}
        debugInfo={debugInfo}
        satPositionProperty={satPositionProperty}
        tleHistoryRef={tleHistoryRef}
        groundTrackHistoryRef={groundTrackHistoryRef} showCesiumOptions={showCesiumOptions} setShowCesiumOptions={setShowCesiumOptions}      />

      {/* Main Cesium globe, stretched to fill the remaining space */}
      <div style={{ flex: 1, position: 'relative' }}>
        <CesiumViewer
          viewerRef={viewerRef}
          lineOfSightPositions={lineOfSightPositions}
          satPositionProperty={satPositionProperty}
          satellites={satellites}
          selectedSatId={selectedSatId}
          groundStationPos={groundStationPos}
          nextAosLosLabel={nextAosLosLabel}
          showTle={showTle}
          showHistory={showHistory}
          tleHistory={tleHistoryRef.current}
          tleFuture={tleFuture instanceof CallbackProperty
            ? tleFuture.getValue(JulianDate.now())
            : tleFuture || []}
          showGroundTrack={showGroundTrack}
          groundTrackHistory={groundTrackHistory.getValue(JulianDate.now())}
          groundTrackFuture={groundTrackFuture instanceof CallbackProperty
            ? groundTrackFuture.getValue(JulianDate.now())
            : []}
          showLineOfSight={showLineOfSight}
          visibilityConeEntities={[]}
          showCesiumOptions={showCesiumOptions}        />
      </div>
    </div>
  );
}

export default CesiumDashboard;
