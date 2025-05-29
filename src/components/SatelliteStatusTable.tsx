import React, { useState, useEffect } from "react";
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
  satPositionProperty: any; // Pass the SampledPositionProperty for the satellite
  tleHistoryRef: React.MutableRefObject<Cartesian3[]>; // Pass the TLE history reference
  groundTrackHistoryRef: React.MutableRefObject<Cartesian3[]>; // Pass the ground track history reference
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
  const [isExpanded, setIsExpanded] = useState(false); // State to control expansion
  const [tlePosition, setTlePosition] = useState<Cartesian3 | null>(null);
  const [groundTrackPosition, setGroundTrackPosition] = useState<Cartesian3 | null>(null);

  useEffect(() => {
    if (!satPositionProperty) return;

    const updatePositions = () => {
      // Update TLE position
      const tlePos = tleHistoryRef.current.length > 0 ? tleHistoryRef.current[0] : null;
      setTlePosition(tlePos);

      // Update Ground Track position
      const groundTrackPos =
        groundTrackHistoryRef.current.length > 0 ? groundTrackHistoryRef.current[0] : null;
      setGroundTrackPosition(groundTrackPos);
    };

    // Update positions on every animation frame
    const interval = setInterval(updatePositions, 1000); // Update every second
    return () => clearInterval(interval); // Cleanup on unmount
  }, [satPositionProperty, tleHistoryRef, groundTrackHistoryRef]);

  return (
    <div
      style={{
        position: "absolute",
        top: 10,
        right: 10,
        zIndex: 1000,
        backgroundColor: "#0d0d0d", // Dark greyish-black background
        color: "#00ff00", // Bright green text
        fontFamily: "Courier New, Courier, monospace", // Console-style font
        border: "1px solid #00ff00", // Green border for the console effect
        borderRadius: "5px",
        boxShadow: "0 0 10px #00ff00", // Glow effect
        cursor: "pointer", // Make it look clickable
        overflow: "hidden", // Prevent content overflow when collapsed
        transition: "height 0.3s ease", // Smooth expand/collapse animation
        width: "320px", // Fixed width
        height: isExpanded ? "auto" : "40px", // Collapsed height is small, expanded height adjusts to content
      }}
      onClick={() => setIsExpanded(!isExpanded)} // Toggle expansion on click
    >
      {/* Header Row (always visible) */}
      <div
        style={{
          padding: "10px",
          textAlign: "center",
          fontWeight: "bold",
          borderBottom: isExpanded ? "1px solid #00ff00" : "none", // Add border when expanded
        }}
      >
        {isExpanded ? "Satellite Status (Click to Collapse)" : "Show Satellite Status"}
      </div>

      {/* Expanded Content (only visible when expanded) */}
      {isExpanded && (
        <div style={{ padding: "15px" }}>
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
            <strong>Station Lat:</strong>{" "}
            {groundStations.find((gs) => gs._id === selectedGroundStationId)?.location.lat || "N/A"}
          </p>
          <p>
            <strong>Station Lon:</strong>{" "}
            {groundStations.find((gs) => gs._id === selectedGroundStationId)?.location.lon || "N/A"}
          </p>
          <p>
            <strong>Station Alt:</strong>{" "}
            {groundStations.find((gs) => gs._id === selectedGroundStationId)?.location.alt * 1000 ||
              "N/A"}{" "}
            {/* Convert km to meters */}
          </p>
          <p>
            <strong>Satellite Name:</strong>{" "}
            {satellites.find((sat) => sat._id === selectedSatId)?.name || "N/A"}
          </p>
        </div>
      )}
    </div>
  );
};

export default SatelliteStatusTable;