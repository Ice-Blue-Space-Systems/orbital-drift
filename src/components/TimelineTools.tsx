import React from "react";
import { IconButton, Tooltip } from "@mui/material";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import SkipPreviousIcon from "@mui/icons-material/SkipPrevious";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import FitScreenIcon from "@mui/icons-material/FitScreen";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

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
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "16px",
        backgroundColor: "rgba(13, 13, 13, 0.9)", // Console-style dark background
        border: "1px solid #00ff00", // Bright green border
        padding: "8px 16px",
        borderRadius: "4px",
        marginBottom: "16px",
      }}
    >
      {/* Jump to Start */}
      <Tooltip title="Jump to Start" arrow>
        <IconButton onClick={onJumpToStart} style={{ color: "#00ff00" }}>
          <SkipPreviousIcon />
        </IconButton>
      </Tooltip>

      {/* Jump to Now */}
      <Tooltip title="Jump to Now" arrow>
        <IconButton onClick={onJumpToNow} style={{ color: "#00ff00" }}>
          <AccessTimeIcon />
        </IconButton>
      </Tooltip>

      {/* Jump to Next Window */}
      <Tooltip title="Jump to Next Window" arrow>
        <IconButton onClick={onJumpToNext} style={{ color: "#00ff00" }}>
          <SkipNextIcon />
        </IconButton>
      </Tooltip>

      {/* Zoom In */}
      <Tooltip title="Zoom In" arrow>
        <IconButton onClick={onZoomIn} style={{ color: "#00ff00" }}>
          <ZoomInIcon />
        </IconButton>
      </Tooltip>

      {/* Zoom Out */}
      <Tooltip title="Zoom Out" arrow>
        <IconButton onClick={onZoomOut} style={{ color: "#00ff00" }}>
          <ZoomOutIcon />
        </IconButton>
      </Tooltip>

      {/* Fit All Windows */}
      <Tooltip title="Fit All Windows" arrow>
        <IconButton onClick={onFitAll} style={{ color: "#00ff00" }}>
          <FitScreenIcon />
        </IconButton>
      </Tooltip>
    </div>
  );
};

export default TimelineTools;