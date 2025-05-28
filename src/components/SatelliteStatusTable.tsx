import React from "react";
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
}

const SatelliteStatusTable: React.FC<SatelliteStatusTableProps> = ({
  debugInfo,
  groundStations,
  satellites,
  selectedSatId,
  selectedGroundStationId,
}) => {
  return (
    <div
      style={{
        position: "absolute",
        top: 10,
        right: 10, // Move to the right side
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        color: "white",
        padding: "10px",
        borderRadius: "5px",
        zIndex: 1000,
        width: "300px", // Adjust width for better readability
      }}
    >
      <h4>Satellite Status</h4>
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
        {debugInfo.tlePosition
          ? `X: ${debugInfo.tlePosition.x.toFixed(2)}, Y: ${debugInfo.tlePosition.y.toFixed(2)}, Z: ${debugInfo.tlePosition.z.toFixed(2)}`
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
        <strong>Station Lat:</strong>{" "}
        {groundStations.find((gs) => gs._id === selectedGroundStationId)?.location.lat || "N/A"}
      </p>
      <p>
        <strong>Station Lon:</strong>{" "}
        {groundStations.find((gs) => gs._id === selectedGroundStationId)?.location.lon || "N/A"}
      </p>
      <p>
        <strong>Station Alt:</strong>{" "}
        {groundStations.find((gs) => gs._id === selectedGroundStationId)?.location.alt * 1000 || "N/A"} {/* Convert km to meters */}
      </p>
      <p>
        <strong>Satellite Name:</strong>{" "}
        {satellites.find((sat) => sat._id === selectedSatId)?.name || "N/A"}
      </p>
    </div>
  );
};

export default SatelliteStatusTable;