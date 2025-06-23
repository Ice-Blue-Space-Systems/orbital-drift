import React, { useEffect, useState } from "react";
import { Cartesian3 } from "cesium";

interface SatelliteStatusTableProps {
  debugInfo?: any;
  groundStations: any[];
  satellites: any[];
  selectedSatId: string;
  selectedGroundStationId: string;
  satPositionProperty?: any;
  tleHistoryRef: React.MutableRefObject<any[]>;
  groundTrackHistoryRef: React.MutableRefObject<any[]>;
  nextContactWindow: any;
}

const SatelliteStatusTable: React.FC<SatelliteStatusTableProps> = ({
  debugInfo,
  groundStations,
  satellites,
  selectedSatId,
  selectedGroundStationId,
  satPositionProperty,
  tleHistoryRef,
  groundTrackHistoryRef,
  nextContactWindow,
}) => {
  const [tlePosition, setTlePosition] = useState<Cartesian3 | null>(null);
  const [groundTrackPosition, setGroundTrackPosition] = useState<Cartesian3 | null>(null);

  useEffect(() => {
    if (!satPositionProperty) return;

    const updatePositions = () => {
      const tlePos = tleHistoryRef.current.length > 0 ? tleHistoryRef.current[0] : null;
      setTlePosition(tlePos);

      const groundTrackPos =
        groundTrackHistoryRef.current.length > 0 ? groundTrackHistoryRef.current[0] : null;
      setGroundTrackPosition(groundTrackPos);
    };

    const interval = setInterval(updatePositions, 1000);
    return () => clearInterval(interval);
  }, [satPositionProperty, tleHistoryRef, groundTrackHistoryRef]);

  // Validate debugInfo.currentTim
  const currentTime = debugInfo?.currentTim
    ? debugInfo.currentTim.toISOString()
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
        <strong>TLE Position:</strong>{" "}
        {tlePosition
          ? `X: ${tlePosition.x.toFixed(2)}, Y: ${tlePosition.y.toFixed(2)}, Z: ${tlePosition.z.toFixed(2)}`
          : "N/A"}
      </p>
      <p>
        <strong>Ground Track Position:</strong>{" "}
        {groundTrackPosition
          ? `X: ${groundTrackPosition.x.toFixed(2)}, Y: ${groundTrackPosition.y.toFixed(2)}, Z: ${groundTrackPosition.z.toFixed(2)}`
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
    </div>
  );
};

export default SatelliteStatusTable;