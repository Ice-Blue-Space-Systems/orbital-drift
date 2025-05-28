import { useState, useEffect, useRef, useMemo } from "react";
import {
  Cartesian3,
  Color,
  JulianDate,
  SampledPositionProperty,
  CallbackProperty,
  Ellipsoid,
  Quaternion,
  ColorMaterialProperty,
  Cartesian2,
} from "cesium";
import { Entity, Viewer, Clock } from "resium";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Drawer,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Button,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { getFuturePositionsWithTime } from "./utils/tleUtils";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "./store";
import { ContactWindow, fetchMongoData } from "./store/mongoSlice";
import { fetchTleBySatelliteId } from "./store/tleSlice";
import { SatelliteStatusTable } from "./components/SatelliteStatusTable";
import ContactWindows from "./components/ContactWindows";
import { selectContactWindows } from "./store/contactWindowsSlice";

function CesiumDashboard() {
  const dispatch: AppDispatch = useDispatch();
  const { satellites, groundStations, status } = useSelector((state: RootState) => state.mongo);
  const contactWindows = useSelector(selectContactWindows);

  const [selectedSatId, setSelectedSatId] = useState("");
  const [selectedGroundStationId, setSelectedGroundStationId] = useState("");
  const [showTle, setShowTle] = useState(false);
  const [showLineOfSight, setShowLineOfSight] = useState(false);
  const [showStatusTable, setShowStatusTable] = useState(false);
  const [inSight, setInSight] = useState(false);
  const [showContactWindowsDrawer, setShowContactWindowsDrawer] = useState(false);
  const [showGroundTrack, setShowGroundTrack] = useState(false);
  const [satPositionProperty, setSatPositionProperty] = useState<SampledPositionProperty | null>(null);
  const [groundStationPos, setGroundStationPos] = useState<Cartesian3 | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [lineOfSightPositions, setLineOfSightPositions] = useState<Cartesian3[]>([]);
  const [showVisibilityCones, setShowVisibilityCones] = useState(false);

  const viewerRef = useRef<any>(null);

  // History Refs to store all “past” positions as the clock moves
  const groundTrackHistoryRef = useRef<Cartesian3[]>([]);
  const tleHistoryRef = useRef<Cartesian3[]>([]);

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchMongoData());
    }
  }, [status, dispatch]);

  useEffect(() => {
    const satellite = satellites.find((sat) => sat._id === selectedSatId);
    if (!satellite) {
      setSatPositionProperty(null);
      return;
    }

    const loadTleAndPosition = async () => {
      try {
        let line1 = "", line2 = "";

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
          const positionProperty = getFuturePositionsWithTime(line1, line2, 1060);
          setSatPositionProperty(positionProperty);
        } else {
          setSatPositionProperty(null);
        }
      } catch (err) {
        console.error("Failed to fetch TLE or compute position", err);
        setSatPositionProperty(null);
      }
    };

    if (selectedSatId) {
      loadTleAndPosition();
    }
  }, [selectedSatId, satellites, dispatch]);

  useEffect(() => {
    const station = groundStations.find((gs) => gs._id === selectedGroundStationId);
    if (station) {
      const { lat, lon, alt } = station.location;
      setGroundStationPos(Cartesian3.fromDegrees(lon, lat, alt));
    } else {
      setGroundStationPos(null);
    }
  }, [selectedGroundStationId, groundStations]);

  // Check “inSight” once at load or whenever data changes
  useEffect(() => {
    if (contactWindows.length > 0 && selectedSatId && selectedGroundStationId && viewerRef.current) {
      const viewer = viewerRef.current.cesiumElement;
      const clock = viewer?.clock;
      if (clock) {
        const now = JulianDate.toDate(clock.currentTime);
        const isInSight = contactWindows.some(
          (window: ContactWindow) =>
            window.satelliteId === selectedSatId &&
            window.groundStationId === selectedGroundStationId &&
            new Date(window.scheduledAOS) <= now &&
            now <= new Date(window.scheduledLOS)
        );
        setInSight(isInSight);
      }
    } else {
      setInSight(false);
    }
  }, [contactWindows, selectedSatId, selectedGroundStationId, viewerRef]);

  // Update the line-of-sight each frame if needed
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

  // Helper function for orienting the cone
function getQuaternionFromTo(fromVec: Cartesian3, toVec: Cartesian3): Quaternion {
  const v0 = Cartesian3.normalize(fromVec, new Cartesian3());
  const v1 = Cartesian3.normalize(toVec, new Cartesian3());
  const dot = Cartesian3.dot(v0, v1);

  if (dot > 0.9999) {
    return Quaternion.IDENTITY; // Aligned
  }
  if (dot < -0.9999) {
    // Opposite direction — rotate 180° around a perpendicular axis
    const axis = Cartesian3.cross(Cartesian3.UNIT_X, v0, new Cartesian3());
    if (Cartesian3.magnitude(axis) < 0.01) {
      Cartesian3.cross(Cartesian3.UNIT_Y, v0, axis);
    }
    Cartesian3.normalize(axis, axis);
    return Quaternion.fromAxisAngle(axis, Math.PI);
  }

  const axis = Cartesian3.cross(v0, v1, new Cartesian3());
  const s = Math.sqrt((1 + dot) * 2);
  const invs = 1 / s;

  return new Quaternion(
    axis.x * invs,
    axis.y * invs,
    axis.z * invs,
    s * 0.5
  );
}


  // Visibility cone
  const visibilityConeEntities = useMemo(() => {
    if (
      !showVisibilityCones ||
      !groundStationPos ||
      !satPositionProperty ||
      !selectedSatId ||
      !selectedGroundStationId
    )
      return [];

    return [
      <Entity
        key="visibility-cone"
        name="Visibility Cone"
        position={groundStationPos}
orientation={new CallbackProperty(() => {
  const satPos = satPositionProperty.getValue(JulianDate.now());
  if (!satPos || !groundStationPos) return Quaternion.IDENTITY;
  return getQuaternionFromTo(groundStationPos, satPos);
}, false)}

        cylinder={{
length: new CallbackProperty(() => {
  const satPos = satPositionProperty.getValue(JulianDate.now());
  return satPos ? Cartesian3.distance(groundStationPos, satPos) : 0;
}, false),
          topRadius: 500000, // Adjust as needed
          bottomRadius: 0,
          material: new ColorMaterialProperty(
            new CallbackProperty(() => {
              const now = JulianDate.toDate(JulianDate.now());
              const isInContact = contactWindows.some(
                (win: ContactWindow) =>
                  win.satelliteId === selectedSatId &&
                  win.groundStationId === selectedGroundStationId &&
                  new Date(win.scheduledAOS) <= now &&
                  now <= new Date(win.scheduledLOS)
              );
              return isInContact
                ? Color.LIME.withAlpha(0.3)
                : Color.RED.withAlpha(0.3);
            }, false)
          ),
        }}
      />,
    ];
  }, [
    showVisibilityCones,
    groundStationPos,
    satPositionProperty,
    contactWindows,
    selectedSatId,
    selectedGroundStationId,
  ]);

  // “inSight” via requestAnimationFrame
  useEffect(() => {
    let rafId: number;
    const checkInSight = () => {
      const viewer = viewerRef.current?.cesiumElement;
      if (!viewer) {
        rafId = requestAnimationFrame(checkInSight);
        return;
      }
      const nowCesium = JulianDate.toDate(viewer.clock.currentTime ?? JulianDate.now());
      const isNowInSight = contactWindows.some(
        (win: ContactWindow) =>
          win.satelliteId === selectedSatId &&
          win.groundStationId === selectedGroundStationId &&
          new Date(win.scheduledAOS) <= nowCesium &&
          nowCesium <= new Date(win.scheduledLOS)
      );
      setInSight(isNowInSight);
      rafId = requestAnimationFrame(checkInSight);
    };

    // Only run if we care about inSight or cones
    if (showVisibilityCones || selectedSatId) {
      checkInSight();
      return () => cancelAnimationFrame(rafId);
    }
  }, [contactWindows, selectedSatId, selectedGroundStationId, showVisibilityCones]);

  //
  // GROUND TRACK
  //

  // Use a ref-based array for the “past” ground track
  useEffect(() => {
    if (!showGroundTrack || !satPositionProperty || !viewerRef.current) return;
    const viewer = viewerRef.current.cesiumElement;

    const recordGroundTrack = () => {
      const now = viewer.clock.currentTime;
      if (!now) return;
      const pos = satPositionProperty.getValue(now);
      if (pos) {
        // Convert to “flattened” carto so height is 0
        const carto = Ellipsoid.WGS84.cartesianToCartographic(pos);
        carto.height = 0;
        groundTrackHistoryRef.current.push(Ellipsoid.WGS84.cartographicToCartesian(carto));
      }
    };

    viewer.clock.onTick.addEventListener(recordGroundTrack);
    return () => viewer.clock.onTick.removeEventListener(recordGroundTrack);
  }, [showGroundTrack, satPositionProperty]);

  // Past ground track (keeps growing)
  const groundTrackHistory = useMemo(() => {
    return new CallbackProperty(() => groundTrackHistoryRef.current, false);
  }, []);

  // Future ground track
  const groundTrackFuture = useMemo(() => {
    if (!showGroundTrack || !satPositionProperty) return null;
    return new CallbackProperty(() => {
      const future: Cartesian3[] = [];
      const viewer = viewerRef.current?.cesiumElement;
      if (!viewer) return future;

      const now = viewer.clock.currentTime;
      if (!now) return future;

      // +60 min from now in 30s increments
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

  const groundTrackEntities = useMemo(() => {
    if (!showGroundTrack || !groundTrackFuture) return null;
    return (
      <>
        <Entity
          name="Ground Track History"
          polyline={{
            positions: groundTrackHistory,
            width: 2,
            material: Color.GRAY, // Past in gray
          }}
        />
        <Entity
          name="Ground Track Future"
          polyline={{
            positions: groundTrackFuture,
            width: 2,
            material: Color.YELLOW, // Future in yellow
          }}
        />
      </>
    );
  }, [showGroundTrack, groundTrackHistory, groundTrackFuture]);

  //
  // TLE TRACK
  //

  // Use a ref-based array for the “past” TLE path
  useEffect(() => {
    if (!showTle || !satPositionProperty || !viewerRef.current) return;
    const viewer = viewerRef.current.cesiumElement;

    const recordTleTrack = () => {
      const now = viewer.clock.currentTime;
      if (!now) return;
      const pos = satPositionProperty.getValue(now);
      if (pos) {
        tleHistoryRef.current.push(pos);
      }
    };

    viewer.clock.onTick.addEventListener(recordTleTrack);
    return () => viewer.clock.onTick.removeEventListener(recordTleTrack);
  }, [showTle, satPositionProperty]);

  // Past TLE track (keeps growing)
  const tleHistory = useMemo(() => {
    return new CallbackProperty(() => tleHistoryRef.current, false);
  }, []);

  // Future TLE track
  const tleFuture = useMemo(() => {
    if (!showTle || !satPositionProperty) return null;
    return new CallbackProperty(() => {
      const positions: Cartesian3[] = [];
      const viewer = viewerRef.current?.cesiumElement;
      if (!viewer) return positions;

      const currentTime = viewer.clock.currentTime;
      if (!currentTime) return positions;

      // +1 hour from now
      for (let i = 0; i <= 3600; i += 30) {
        const offsetTime = JulianDate.addSeconds(currentTime, i, new JulianDate());
        const pos = satPositionProperty.getValue(offsetTime);
        if (pos) positions.push(pos);
      }
      return positions;
    }, false);
  }, [showTle, satPositionProperty]);

  // Find the next scheduled contact window
  const nextContactWindow = useMemo(() => {
    if (!selectedSatId || !selectedGroundStationId) return null;
    const now = new Date();
    // Filter for future windows for the selected sat & GS
    const futureWindows = contactWindows.filter((win: ContactWindow) =>
      win.satelliteId === selectedSatId &&
      win.groundStationId === selectedGroundStationId &&
      new Date(win.scheduledLOS) > now
    );

    if (futureWindows.length === 0) return null;

    // Sort by earliest AOS
    futureWindows.sort(
      (a: ContactWindow, b: ContactWindow) => 
      new Date(a.scheduledAOS).getTime() - new Date(b.scheduledAOS).getTime()
    );

    return futureWindows[0];
  }, [contactWindows, selectedSatId, selectedGroundStationId]);

  // Text for label
  const nextAosLosLabel = useMemo(() => {
    if (!nextContactWindow) return "No upcoming contact";
    return (
      "Next AOS: " +
      new Date(nextContactWindow.scheduledAOS).toISOString() + // Use UTC
      "\nLOS: " +
      new Date(nextContactWindow.scheduledLOS).toISOString()  // Use UTC
    );
  }, [nextContactWindow]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <AppBar position="static">
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={() => setDrawerOpen(true)}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6">Cesium Dashboard</Typography>
        </Toolbar>
      </AppBar>

      {/* Left Drawer */}
      <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box style={{ width: 280, padding: 16 }}>
          <FormControl size="small" fullWidth>
            <InputLabel>Ground Station</InputLabel>
            <Select
              value={selectedGroundStationId}
              onChange={(e) => setSelectedGroundStationId(e.target.value)}
            >
              {groundStations.map((gs) => (
                <MenuItem key={gs._id} value={gs._id}>
                  {gs.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" fullWidth style={{ marginTop: 16 }}>
            <InputLabel>Satellite</InputLabel>
            <Select value={selectedSatId} onChange={(e) => setSelectedSatId(e.target.value)}>
              {satellites.map((sat) => (
                <MenuItem key={sat._id} value={sat._id}>
                  {sat.name} ({sat.type})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormGroup style={{ marginTop: 16 }}>
            <FormControlLabel
              control={<Checkbox checked={showTle} onChange={(e) => setShowTle(e.target.checked)} />}
              label="Show TLE"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={showLineOfSight}
                  onChange={(e) => setShowLineOfSight(e.target.checked)}
                />
              }
              label="Show Line of Sight"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={showVisibilityCones}
                  onChange={(e) => setShowVisibilityCones(e.target.checked)}
                />
              }
              label="Show Visibility Cones"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={showStatusTable}
                  onChange={(e) => setShowStatusTable(e.target.checked)}
                />
              }
              label="Show Status Table"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={showGroundTrack}
                  onChange={(e) => setShowGroundTrack(e.target.checked)}
                />
              }
              label="Show Ground Track"
            />
          </FormGroup>

          {selectedSatId && selectedGroundStationId && (
            <Button
              variant="contained"
              onClick={() => setShowContactWindowsDrawer(true)}
              style={{ marginTop: 16 }}
            >
              View Contact Windows
            </Button>
          )}
        </Box>
      </Drawer>

      {/* Contact Windows Drawer */}
      <ContactWindows
        open={showContactWindowsDrawer}
        onClose={() => setShowContactWindowsDrawer(false)}
        satelliteId={selectedSatId}
        groundStationId={selectedGroundStationId}
      />

      {/* Right Drawer (Status Table) */}
      <Drawer anchor="right" open={showStatusTable} onClose={() => setShowStatusTable(false)}>
        <Box style={{ width: 300, padding: 16 }}>
          <SatelliteStatusTable
            stationName={groundStations.find((gs) => gs._id === selectedGroundStationId)?.name || null}
            stationLat={groundStations.find((gs) => gs._id === selectedGroundStationId)?.location.lat || null}
            stationLon={groundStations.find((gs) => gs._id === selectedGroundStationId)?.location.lon || null}
            stationAlt={groundStations.find((gs) => gs._id === selectedGroundStationId)?.location.alt || null}
            satName={satellites.find((sat) => sat._id === selectedSatId)?.name || null}
            satPosition={lineOfSightPositions[1] || null}
            trueTlePosition={satPositionProperty?.getValue(JulianDate.now()) || null}
            deviation={null}
            expectedInSight={inSight}
            confirmedInSight={false}
          />
        </Box>
      </Drawer>

      {/* Main Viewer */}
      <div style={{ flex: 1, position: "relative" }}>
        <Viewer ref={viewerRef} style={{ position: "absolute", inset: 0 }}>
          {visibilityConeEntities}
          <Clock shouldAnimate={true} />

          {/* Satellite with name label */}
          {satPositionProperty && (
            <Entity
              name="Satellite"
              position={satPositionProperty}
              point={{ pixelSize: 12, color: Color.YELLOW }}
              label={{
                text: satellites.find((sat) => sat._id === selectedSatId)?.name || "Satellite",
                font: "14px sans-serif",
                fillColor: Color.WHITE,
                style: 2, // LabelStyle.OUTLINE
                outlineWidth: 2,
                pixelOffset: new Cartesian2(0, -20),
                showBackground: true,
              }}
            />
          )}

          {/* Ground Station with AOS/LOS label */}
          {groundStationPos && (
            <Entity
              name="Ground Station"
              position={groundStationPos}
              point={{ pixelSize: 8, color: Color.RED }}
              label={{
                text: nextAosLosLabel,
                font: "14px sans-serif",
                fillColor: Color.WHITE,
                style: 2,
                outlineWidth: 2,
                pixelOffset: new Cartesian2(0, -40),
                showBackground: true,
              }}
            />
          )}

          {/* TLE Paths */}
          {showTle && (
            <>
              <Entity
                name="TLE Path - Past"
                polyline={{
                  positions: tleHistory,
                  width: 2,
                  material: Color.GRAY, // Past TLE in gray
                }}
              />
              {tleFuture && (
                <Entity
                  name="TLE Path - Future"
                  polyline={{
                    positions: tleFuture,
                    width: 2,
                    material: Color.GREEN, // Future TLE in green
                  }}
                />
              )}
            </>
          )}

          {/* Line of Sight */}
          {showLineOfSight && lineOfSightPositions.length === 2 && (
            <Entity
              name="Line of Sight"
              polyline={{
                positions: new CallbackProperty(() => lineOfSightPositions, false),
                material: Color.BLUE,
                width: 5,
              }}
            />
          )}

          {/* Ground Track */}
          {groundTrackEntities}
        </Viewer>
      </div>
    </div>
  );
}

export default CesiumDashboard;
