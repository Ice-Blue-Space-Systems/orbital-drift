import React, { useEffect, useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../store";
import {
  calculateDopplerShift,
  calculateLineOfSight,
  calculateRadialVelocity,
  calculateAzimuth,
  calculateElevation,
} from "../utils/mathUtils";
import { convertEcefToEnu } from "../utils/coordinateUtils";
import { selectCesiumClockIso } from "../store/selectors/cesiumClockSelectors";
import { getDisplayGroundStations, type DisplayGroundStation } from "../utils/groundStationDataUtils";
import "./DockableComponent.css"; // Import the CSS for styling

interface SatelliteStatusTableProps {
  debugInfo?: any;
  nextContactWindow: any;
}

const SatelliteStatusTable: React.FC<SatelliteStatusTableProps> = ({
  debugInfo,
  nextContactWindow,
}) => {
  const [dopplerShift, setDopplerShift] = useState<number | null>(null);
  const [azimuth, setAzimuth] = useState<number | null>(null);
  const [elevation, setElevation] = useState<number | null>(null);

  const selectedSatId = useSelector(
    (state: RootState) => state.mongo.selectedSatId
  ); // Retrieve selected satellite ID
  const selectedGroundStationId = useSelector(
    (state: RootState) => state.mongo.selectedGroundStationId
  );
  const { satellites, groundStations } = useSelector(
    (state: RootState) => state.mongo
  );
  
  // Get merged ground station data (API + predefined)
  const displayGroundStations = useMemo(() => {
    return getDisplayGroundStations(groundStations);
  }, [groundStations]);
  
  const iso = useSelector(selectCesiumClockIso);

  useEffect(() => {
    if (!debugInfo) return;

    const satPos = debugInfo.satellitePosition;
    const gsPos = debugInfo.groundStationPosition;

    if (!satPos || !gsPos) return;

    // Convert ECEF to ENU
    const enuVector = convertEcefToEnu(satPos, gsPos);

    // Calculate azimuth and elevation
    setAzimuth(calculateAzimuth(enuVector));
    setElevation(calculateElevation(enuVector));

    // Calculate Doppler shift
    const satVel = debugInfo.satelliteVelocity;
    if (satVel) {
      const lineOfSight = calculateLineOfSight(satPos, gsPos);
      const radialVelocity = calculateRadialVelocity(satVel, lineOfSight);
      const baseFrequencyHz = 145800000; // Base frequency in Hz
      const shift = calculateDopplerShift(baseFrequencyHz, radialVelocity);
      setDopplerShift(shift);
    }
  }, [debugInfo]);

  return (
    <div
      style={{
        flex: 1, // Allow the table to expand and fill available space
        overflowY: "auto", // Add scrolling if content overflows
        padding: "10px", // Add padding for spacing
        color: "#00ff00",
        fontFamily: "Courier New, Courier, monospace",
      }}
    >
      <h3>Satellite Status</h3>
      <p>
        <strong>Current Time:</strong> {iso}
      </p>
      <p>
        <strong>Satellite Position:</strong>{" "}
        {debugInfo.satellitePosition
          ? `X: ${debugInfo.satellitePosition.x.toFixed(2)}, Y: ${debugInfo.satellitePosition.y.toFixed(2)}, Z: ${debugInfo.satellitePosition.z.toFixed(2)}`
          : "N/A"}
      </p>
      <p>
        <strong>Ground Track Position:</strong>{" "}
        {debugInfo.groundTrackPosition
          ? `X: ${debugInfo.groundTrackPosition.x.toFixed(2)}, Y: ${debugInfo.groundTrackPosition.y.toFixed(2)}, Z: ${debugInfo.groundTrackPosition.z.toFixed(2)}`
          : "N/A"}
      </p>
      <p>
        <strong>In Sight:</strong> {debugInfo.inSight ? "Yes" : "No"}
      </p>
      <p>
        <strong>Station Name:</strong>{" "}
        {displayGroundStations.find((gs: DisplayGroundStation) => gs.id === selectedGroundStationId)
          ?.name || "N/A"}
      </p>
      <p>
        <strong>Satellite Name:</strong>{" "}
        {satellites.find((sat) => sat._id === selectedSatId)?.name || "N/A"}
      </p>
      <p>
        <strong>Next Contact Window:</strong>{" "}
        {nextContactWindow ? (
          <>
            AOS (UTC): {new Date(nextContactWindow.scheduledAOS).toISOString()}
            <br />
            LOS (UTC): {new Date(nextContactWindow.scheduledLOS).toISOString()}
          </>
        ) : (
          "No upcoming contact"
        )}
      </p>
      <p>
        <strong>Azimuth:</strong>{" "}
        {azimuth !== null ? `${azimuth.toFixed(2)}°` : "N/A"}
      </p>
      <p>
        <strong>Elevation:</strong>{" "}
        {elevation !== null ? `${elevation.toFixed(2)}°` : "N/A"}
      </p>
      <p>
        <strong>Doppler Shift:</strong>{" "}
        {dopplerShift !== null
          ? `${(dopplerShift / 1000).toFixed(2)} kHz`
          : "N/A"}
      </p>
      <p>
        <strong>Adjusted Frequency:</strong>{" "}
        {dopplerShift
          ? `${((145800000 + dopplerShift) / 1e6).toFixed(4)} MHz`
          : "N/A"}
      </p>
      <p>
        <strong>Satellite Velocity:</strong>{" "}
        {debugInfo.satelliteVelocity
          ? `Ẋ: ${debugInfo.satelliteVelocity.x.toFixed(2)}, Ẏ: ${debugInfo.satelliteVelocity.y.toFixed(2)}, Ż: ${debugInfo.satelliteVelocity.z.toFixed(2)} (m/s)`
          : "N/A"}
      </p>
    </div>
  );
};

export default SatelliteStatusTable;
