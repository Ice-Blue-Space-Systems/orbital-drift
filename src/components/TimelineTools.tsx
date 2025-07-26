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
  const selectedSatId = useSelector(
    (state: RootState) => state.mongo.selectedSatId
  );
  const selectedGroundStationId = useSelector(
    (state: RootState) => state.mongo.selectedGroundStationId
  );
    
  return (
    <div className="timeline-tools">
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
        {selectedSatId && selectedGroundStationId && (
          <ContactWindowsPopover
            satelliteId={selectedSatId}
            groundStationId={selectedGroundStationId}
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
