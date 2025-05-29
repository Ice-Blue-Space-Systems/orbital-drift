import React, { useEffect, useState } from "react";
import { Cartesian3 } from "cesium";

interface SatelliteStatusTableProps {
  debugInfo: {
    satellitePosition: Cartesian3 | null;
    tlePosition: Cartesian3 | null;
    groundTrackPosition: Cartesian3 | null;
    currentTime: Date | null;
    inSight: boolean;
  };
  groundStations: any[];
  satellites: any[];
  selectedSatId: string;
  selectedGroundStationId: string;
  satPositionProperty: any;
  tleHistoryRef: React.MutableRefObject<Cartesian3[]>;
  groundTrackHistoryRef: React.MutableRefObject<Cartesian3[]>;
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

  return (
    <div
      style={{
        flex: 1, // Allow the table to expand and fill available space
        overflowY: "auto", // Add scrolling if content overflows
        padding: "10px", // Add padding for spacing
      }}
    >
      <p>
        <strong>Current Time:</strong> {debugInfo.currentTime?.toISOString() || "N/A"}
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
    </div>
  );
};

export default SatelliteStatusTable;