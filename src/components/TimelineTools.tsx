import React from "react";
import { IconButton, Tooltip, Divider } from "@mui/material";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import SkipPreviousIcon from "@mui/icons-material/SkipPrevious";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import FitScreenIcon from "@mui/icons-material/FitScreen";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import SatellitePopover from "./SatellitePopover"; // Import SatellitePopover
import GroundStationPopover from "./GroundStationPopover"; // Import GroundStationPopover
import ContactWindowsPopover from "./ContactWindowsPopover"; // Import ContactWindowsPopover
import ConsolePopover from "./ConsolePopover"; // Import ConsolePopover
import "./TimelineTools.css"; // Import the CSS file

export interface TimelineToolsProps {
  onJumpToNext: () => void;
  onJumpToStart: () => void;
  onJumpToNow: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitAll: () => void;
  satellites: any;
  groundStations: any;
  selectedSatId: string;
  setSelectedSatId: React.Dispatch<React.SetStateAction<string>>;
  selectedGroundStationId: string;
  setSelectedGroundStationId: React.Dispatch<React.SetStateAction<string>>;
  showTle: boolean;
  setShowTle: React.Dispatch<React.SetStateAction<boolean>>;
  showHistory: boolean;
  setShowHistory: React.Dispatch<React.SetStateAction<boolean>>;
  showGroundTrack: boolean;
  setShowGroundTrack: React.Dispatch<React.SetStateAction<boolean>>;
  showLineOfSight: boolean;
  setShowLineOfSight: React.Dispatch<React.SetStateAction<boolean>>;
  showVisibilityCones: boolean;
  setShowVisibilityCones: React.Dispatch<React.SetStateAction<boolean>>;
  showCesiumOptions: boolean; // Added this property
  setShowCesiumOptions: React.Dispatch<React.SetStateAction<boolean>>; // Added this property
  debugInfo?: any;
  satPositionProperty?: any;
  tleHistoryRef: React.MutableRefObject<any[]>;
  groundTrackHistoryRef: React.MutableRefObject<any[]>;
  nextContactWindow: any;
}

const TimelineTools: React.FC<TimelineToolsProps> = ({
  onJumpToNext,
  onJumpToStart,
  onJumpToNow,
  onZoomIn,
  onZoomOut,
  onFitAll,
  satellites,
  groundStations,
  selectedSatId,
  setSelectedSatId,
  selectedGroundStationId,
  setSelectedGroundStationId,
  showTle,
  setShowTle,
  showHistory,
  setShowHistory,
  showGroundTrack,
  setShowGroundTrack,
  showLineOfSight,
  setShowLineOfSight,
  showVisibilityCones,
  setShowVisibilityCones,
  debugInfo,
  satPositionProperty,
  tleHistoryRef,
  groundTrackHistoryRef,
  nextContactWindow,
}) => {
  const currentPath = window.location.pathname;

    const arrowPosition =
    {
      "/globe": "28px", // Position under the PublicIcon button
      "/timeline": "92px", // Adjust based on the Timeline button's position
      "/sats": "156px", // Adjust based on the Satellite button's position
      "/gs": "220px", // Adjust based on the Ground Station button's position
    }[currentPath] || "16px"; // Default to Globe if no match
    
  return (
    <div
      className="timeline-tools"
      style={{
        position: "absolute",
        top: "0px", // Position below the navigation bar
        left: "0px", // Align to the left
        width: "550px", // Fixed width similar to GlobeTools
        backgroundColor: "rgba(13, 13, 13, 0.9)", // Transparent console-style background
        padding: "12px", // Padding for content
        borderTop: "1px solid #00ff00", // Green top border
        boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)", // Subtle shadow for depth
        zIndex: 1000,
      }}
    >
      {/* Green Arrow */}
      {currentPath === "/timeline" && (
        <div
          style={{
            position: "absolute",
            top: "-8px", // Position above the TimelineTools panel
            left:  arrowPosition, // Dynamically position the arrow
            transform: "translateX(-50%)",
            width: "0",
            height: "0",
            borderLeft: "8px solid transparent",
            borderRight: "8px solid transparent",
            borderBottom: "8px solid #00ff00", // Green arrow
            zIndex: 1001, // Ensure it appears above the panel
          }}
        ></div>
      )}

      {/* Timeline Buttons */}
      <div
        style={{
          display: "flex", // Arrange buttons horizontally
          gap: "16px", // Space between buttons
          alignItems: "center", // Align buttons vertically
        }}
      >
        <Tooltip title="Jump to Start" arrow>
          <IconButton onClick={onJumpToStart} className="icon-button">
            <SkipPreviousIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Jump to Now" arrow>
          <IconButton onClick={onJumpToNow} className="icon-button">
            <AccessTimeIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Jump to Next Window" arrow>
          <IconButton onClick={onJumpToNext} className="icon-button">
            <SkipNextIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Zoom In" arrow>
          <IconButton onClick={onZoomIn} className="icon-button">
            <ZoomInIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Zoom Out" arrow>
          <IconButton onClick={onZoomOut} className="icon-button">
            <ZoomOutIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Fit All Windows" arrow>
          <IconButton onClick={onFitAll} className="icon-button">
            <FitScreenIcon />
          </IconButton>
        </Tooltip>

        {/* Vertical Divider */}
        <Divider
          orientation="vertical"
          flexItem
          style={{
            backgroundColor: "#888888", // Grey color for the divider
            margin: "0 16px", // Add spacing around the divider
            height: "32px", // Set the height of the divider
          }}
        />

        {/* Satellite Popover */}
        <SatellitePopover
          showTle={showTle}
          setShowTle={setShowTle}
          showHistory={showHistory}
          setShowHistory={setShowHistory}
          showGroundTrack={showGroundTrack}
          setShowGroundTrack={setShowGroundTrack}
        />

        {/* Ground Station Popover */}
        <GroundStationPopover
          groundStations={groundStations}
          selectedGroundStationId={selectedGroundStationId}
          setSelectedGroundStationId={setSelectedGroundStationId}
          showLineOfSight={showLineOfSight}
          setShowLineOfSight={setShowLineOfSight}
          showVisibilityCones={showVisibilityCones}
          setShowVisibilityCones={setShowVisibilityCones}
        />

        {/* Contact Windows Popover */}
        {selectedSatId && selectedGroundStationId && (
          <ContactWindowsPopover
            satelliteId={selectedSatId}
            groundStationId={selectedGroundStationId}
          />
        )}

        {/* Console Popover */}
        <ConsolePopover
          debugInfo={debugInfo}
          groundStations={groundStations}
          selectedGroundStationId={selectedGroundStationId}
          satPositionProperty={satPositionProperty}
          tleHistoryRef={tleHistoryRef}
          groundTrackHistoryRef={groundTrackHistoryRef}
          nextContactWindow={nextContactWindow}
        />
      </div>
    </div>
  );
};

export default TimelineTools;
