import React from "react";
import { IconButton, Tooltip } from "@mui/material";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import SkipPreviousIcon from "@mui/icons-material/SkipPrevious";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import FitScreenIcon from "@mui/icons-material/FitScreen";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import "./TimelineTools.css"; // Import the CSS file

interface TimelineToolsProps {
  onJumpToNext: () => void;
  onJumpToStart: () => void;
  onJumpToNow: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitAll: () => void;
}

const TimelineTools: React.FC<TimelineToolsProps> = ({
  onJumpToNext,
  onJumpToStart,
  onJumpToNow,
  onZoomIn,
  onZoomOut,
  onFitAll,
}) => {
  return (
    <div className="timeline-tools">
      {/* Jump to Start */}
      <Tooltip title="Jump to Start" arrow>
        <IconButton onClick={onJumpToStart} className="icon-button">
          <SkipPreviousIcon />
        </IconButton>
      </Tooltip>

      {/* Jump to Now */}
      <Tooltip title="Jump to Now" arrow>
        <IconButton onClick={onJumpToNow} className="icon-button">
          <AccessTimeIcon />
        </IconButton>
      </Tooltip>

      {/* Jump to Next Window */}
      <Tooltip title="Jump to Next Window" arrow>
        <IconButton onClick={onJumpToNext} className="icon-button">
          <SkipNextIcon />
        </IconButton>
      </Tooltip>

      {/* Zoom In */}
      <Tooltip title="Zoom In" arrow>
        <IconButton onClick={onZoomIn} className="icon-button">
          <ZoomInIcon />
        </IconButton>
      </Tooltip>

      {/* Zoom Out */}
      <Tooltip title="Zoom Out" arrow>
        <IconButton onClick={onZoomOut} className="icon-button">
          <ZoomOutIcon />
        </IconButton>
      </Tooltip>

      {/* Fit All Windows */}
      <Tooltip title="Fit All Windows" arrow>
        <IconButton onClick={onFitAll} className="icon-button">
          <FitScreenIcon />
        </IconButton>
      </Tooltip>
    </div>
  );
};

export default TimelineTools;