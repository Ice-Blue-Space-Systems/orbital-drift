import React, { useState, useRef } from "react";
import { IconButton, Tooltip, TextField, List, ListItem, ListItemButton, ListItemText } from "@mui/material";
import SatelliteIcon from "@mui/icons-material/SatelliteAlt";
import HistoryIcon from "@mui/icons-material/History";
import PublicIcon from "@mui/icons-material/Public";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../store";
import { setSelectedSatId, setShowHistory, setShowTle, setShowGroundTrack } from "../store/mongoSlice";

const SatellitePopover: React.FC = () => {
  const dispatch = useDispatch();
  const [openPopover, setOpenPopover] = useState<boolean>(false);
  const [satelliteFilter, setSatelliteFilter] = useState<string>("");
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { satellites, selectedSatId } = useSelector((state: RootState) => state.mongo);
  const showHistoryState = useSelector((state: RootState) => state.mongo.showHistory);
  const showTleState = useSelector((state: RootState) => state.mongo.showTle);
  const showGroundTrackState = useSelector((state: RootState) => state.mongo.showGroundTrack);

  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setOpenPopover(true);
  };

  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setOpenPopover(false);
    }, 200); // 200ms delay before closing
  };

  return (
    <div
      style={{ position: "relative" }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Satellite Button */}
      <IconButton
        className={`icon-button ${selectedSatId ? 'active' : ''}`}
      >
        <SatelliteIcon />
      </IconButton>

      {/* Satellite Popover */}
      {openPopover && (
        <div
          style={{
            position: "absolute",
            top: "46px", // Slightly reduced gap
            left: "0",
            backgroundColor: "rgba(13, 13, 13, 0.9)",
            border: "1px solid #00ff00",
            color: "#00ff00",
            fontFamily: "Courier New, Courier, monospace",
            borderRadius: "4px",
            padding: "8px",
            width: "400px",
            zIndex: 1001,
          }}
        >
          {/* Arrow */}
          <div
            style={{
              position: "absolute",
              top: "-8px",
              left: "16px",
              width: "0",
              height: "0",
              borderLeft: "8px solid transparent",
              borderRight: "8px solid transparent",
              borderBottom: "8px solid #00ff00", // Green arrow
            }}
          ></div>

          {/* Show TLE, History, and Ground Track Toggles */}
          <div className="globe-tools-group" style={{ marginBottom: "8px" }}>
            {/* Toggle TLE */}
            <Tooltip title="Toggle TLE" arrow placement="bottom">
              <IconButton
                onClick={() => dispatch(setShowTle(!showTleState))} // Dispatch Redux action
                className={`icon-button ${showTleState ? 'active' : ''}`}
              >
                <SatelliteIcon />
              </IconButton>
            </Tooltip>

            {/* Toggle History */}
            <Tooltip title="Toggle History" arrow placement="bottom">
              <IconButton
                onClick={() => dispatch(setShowHistory(!showHistoryState))} // Dispatch Redux action
                className={`icon-button ${showHistoryState ? 'active' : ''}`}
              >
                <HistoryIcon />
              </IconButton>
            </Tooltip>

            {/* Toggle Ground Track */}
            <Tooltip title="Toggle Ground Track" arrow placement="bottom">
              <IconButton
                onClick={() => dispatch(setShowGroundTrack(!showGroundTrackState))} // Dispatch Redux action
                className={`icon-button ${showGroundTrackState ? 'active' : ''}`}
              >
                <PublicIcon />
              </IconButton>
            </Tooltip>
          </div>

          {/* Filter and List */}
          <TextField
            fullWidth
            placeholder="Filter Satellites"
            value={satelliteFilter}
            onChange={(e) => setSatelliteFilter(e.target.value)}
            style={{
              marginBottom: "8px",
              backgroundColor: "#1e1e1e", // Slightly lighter background for input
              color: "#00ff00",
            }}
            InputProps={{
              style: { color: "#00ff00" }, // Green text for input
            }}
          />
          <List>
            {satellites
              .filter((sat) =>
                sat.name.toLowerCase().includes(satelliteFilter.toLowerCase())
              )
              .map((sat) => (
                <ListItem key={sat._id} disablePadding>
                  <ListItemButton
                    onClick={() => {
                      dispatch(setSelectedSatId(sat._id)); // Update Redux store
                      setOpenPopover(false); // Close popover after selection
                    }}
                    style={{
                      color: "#00ff00",
                      transition: "background-color 0.2s ease-in-out",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = "#1e1e1e")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "transparent")
                    }
                  >
                    <ListItemText primary={sat.name} />
                  </ListItemButton>
                </ListItem>
              ))}
          </List>
        </div>
      )}
    </div>
  );
};

export default SatellitePopover;