import React, { useEffect, useState } from "react";
import { Cartesian3 } from "cesium";
import { useSelector } from "react-redux";
import { RootState } from "../store";

interface SatelliteStatusTableProps {
  debugInfo?: any;
  nextContactWindow: any;
}

const SatelliteStatusTable: React.FC<SatelliteStatusTableProps> = ({
  debugInfo,
  nextContactWindow,
}) => {
  const [dopplerShift, setDopplerShift] = useState<number | null>(null);
  const selectedSatId = useSelector((state: RootState) => state.mongo.selectedSatId); // Retrieve selected satellite ID
  const selectedGroundStationId = useSelector(
    (state: RootState) => state.mongo.selectedGroundStationId
  );
  const { satellites, groundStations } = useSelector((state: RootState) => state.mongo);

  useEffect(() => {
    if (!debugInfo) return;

    // Compute line-of-sight vector (station -> satellite).
    const satVel = debugInfo.satelliteVelocity; // velocity in m/s
    const satPos = debugInfo.satellitePosition;
    const gsPos = debugInfo.groundStationPosition;

    if (!satVel || !satPos || !gsPos) return;

    // lineOfSight = normalize(satPos - gsPos)
    const lineOfSight = Cartesian3.subtract(satPos, gsPos, new Cartesian3());
    Cartesian3.normalize(lineOfSight, lineOfSight);

    // radialVelocity = dot(satVel, lineOfSight)
    const radialVelocity = Cartesian3.dot(satVel, lineOfSight);

    // base frequency (Hz)
    const f0 = 145800000;
    const shift = calculateDopplerShift(f0, radialVelocity);
    setDopplerShift(shift);
  }, [debugInfo]);

  // Doppler calculation helper
  const calculateDopplerShift = (
    baseFrequencyHz: number,
    radialVelocity: number
  ) => {
    const c = 299792458; // Speed of light (m/s)
    return baseFrequencyHz * (radialVelocity / c);
  };

  // Validate debugInfo.currentTime
  const currentTime = debugInfo?.currentTime
    ? debugInfo.currentTime.toISOString()
    : "N/A";

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
        <strong>Current Time:</strong> {currentTime}
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
        {groundStations.find((gs) => gs._id === selectedGroundStationId)?.name || "N/A"}
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
        <strong>Doppler Shift:</strong>{" "}
        {dopplerShift
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