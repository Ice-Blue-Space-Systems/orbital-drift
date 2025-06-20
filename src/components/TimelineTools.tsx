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
  return (
    <div className="timeline-tools" style={{ display: "flex", alignItems: "center" }}>
      {/* Timeline Buttons */}
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
        satellites={satellites}
        selectedSatId={selectedSatId}
        setSelectedSatId={setSelectedSatId}
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
        satellites={satellites}
        selectedSatId={selectedSatId}
        selectedGroundStationId={selectedGroundStationId}
        satPositionProperty={satPositionProperty}
        tleHistoryRef={tleHistoryRef}
        groundTrackHistoryRef={groundTrackHistoryRef}
        nextContactWindow={nextContactWindow}
      />
    </div>
  );
};

export default TimelineTools;