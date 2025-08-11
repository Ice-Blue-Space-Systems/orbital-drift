import React from "react";
import { IconButton, Tooltip } from "@mui/material";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import SkipPreviousIcon from "@mui/icons-material/SkipPrevious";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import FitScreenIcon from "@mui/icons-material/FitScreen";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import LocationDisabledIcon from "@mui/icons-material/LocationDisabled";
import FilterListIcon from "@mui/icons-material/FilterList";
import FilterListOffIcon from "@mui/icons-material/FilterListOff";
import SatellitePopover from "./SatellitePopover"; // Import SatellitePopover
import GroundStationPopover from "./GroundStationPopover"; // Import GroundStationPopover
import ContactWindowsPopover from "./ContactWindowsPopover"; // Import ContactWindowsPopover
import ConsolePopover from "./ConsolePopover"; // Import ConsolePopover
import "./TimelineTools.css"; // Import the CSS file
import { useSelector } from "react-redux";
import { RootState } from "../store";
import { useTheme } from "../contexts/ThemeContext";

export interface TimelineToolsProps {
  onJumpToNext: () => void;
  onJumpToStart: () => void;
  onJumpToNow: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitAll: () => void;
  onToggleFollow: () => void;
  onToggleShowAll?: () => void;
  followMode: boolean;
  showAllPairs?: boolean;
  debugInfo?: any;
  nextContactWindow: any;
}

const TimelineTools: React.FC<TimelineToolsProps> = ({
  onJumpToNext,
  onJumpToStart,
  onJumpToNow,
  onZoomIn,
  onZoomOut,
  onFitAll,
  onToggleFollow,
  onToggleShowAll,
  followMode,
  showAllPairs = true,
  debugInfo,
  nextContactWindow,
}) => {
  const { theme } = useTheme();
  const selectedSatId = useSelector(
    (state: RootState) => state.mongo.selectedSatId
  );
  const selectedGroundStationId = useSelector(
    (state: RootState) => state.mongo.selectedGroundStationId
  );
  
  // Get satellites and ground stations data to find names
  const { satellites, groundStations } = useSelector((state: RootState) => state.mongo);
  
  // Find the selected satellite and ground station names
  const selectedSatellite = satellites.find((sat: any) => sat._id === selectedSatId);
  const selectedGroundStation = groundStations.find((gs: any) => gs._id === selectedGroundStationId);
    
  return (
    <div 
      className="timeline-tools"
      style={{
        // CSS Custom Properties for the CSS file to use
        '--theme-primary': theme.primary,
        '--theme-primary-rgb': theme.primaryRGB,
      } as React.CSSProperties}
    >
      {/* Timeline Buttons Container */}
      <div className="timeline-tools-buttons">
        <div className="timeline-tools-group">
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
          <Tooltip title={followMode ? "Disable Follow Mode" : "Enable Follow Mode"} arrow>
            <IconButton 
              onClick={onToggleFollow} 
              className={`icon-button ${followMode ? 'active' : ''}`}
            >
              {followMode ? <MyLocationIcon /> : <LocationDisabledIcon />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Jump to Next Window" arrow>
            <IconButton onClick={onJumpToNext} className="icon-button">
              <SkipNextIcon />
            </IconButton>
          </Tooltip>
        </div>

        <div className="timeline-tools-divider"></div>

        <div className="timeline-tools-group">
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
          {onToggleShowAll && (
            <Tooltip title={showAllPairs ? "Show Selected Only" : "Show All Pairs"} arrow>
              <IconButton 
                onClick={onToggleShowAll} 
                className={`icon-button ${!showAllPairs ? 'active' : ''}`}
              >
                {showAllPairs ? <FilterListOffIcon /> : <FilterListIcon />}
              </IconButton>
            </Tooltip>
          )}
        </div>

        <div className="timeline-tools-divider"></div>

        {/* Satellite Popover */}
        <SatellitePopover />

        {/* Ground Station Popover */}
        <GroundStationPopover />

        {/* Contact Windows Popover */}
        {selectedSatId && selectedGroundStationId && satellites.length > 0 && groundStations.length > 0 && (
          <ContactWindowsPopover
            key={`${selectedSatId}-${selectedGroundStationId}-${selectedSatellite?.name || 'unknown'}`}
            satelliteId={selectedSatId}
            groundStationId={selectedGroundStationId}
            satelliteName={selectedSatellite?.name || "Unknown Satellite"}
            groundStationName={selectedGroundStation?.name || "Unknown Ground Station"}
          />
        )}

        {/* Console Popover */}
        <ConsolePopover
          debugInfo={debugInfo}
          nextContactWindow={nextContactWindow}
        />
      </div>
    </div>
  );
};

export default TimelineTools;
