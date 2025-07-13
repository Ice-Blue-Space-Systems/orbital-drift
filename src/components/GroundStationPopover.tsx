import React, { useState, useRef } from "react";
import { IconButton, Tooltip, TextField, List, ListItem, ListItemButton, ListItemText } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import RadarIcon from "@mui/icons-material/Radar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSatelliteDish } from "@fortawesome/free-solid-svg-icons";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../store";
import { setSelectedGroundStationId, setShowLineOfSight, setShowVisibilityCones } from "../store/mongoSlice";

const GroundStationPopover: React.FC = () => {

  const dispatch = useDispatch();
  const [openPopover, setOpenPopover] = useState<boolean>(false);
  const [groundStationFilter, setGroundStationFilter] = useState<string>("");
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const {groundStations, selectedGroundStationId } = useSelector((state: RootState) => state.mongo);
  const showLineOfSight = useSelector((state: RootState) => state.mongo.showLineOfSight);
  const showVisibilityCones = useSelector((state: RootState) => state.mongo.showVisibilityCones);

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
      {/* Ground Station Button */}
      <IconButton
        className={`icon-button ${selectedGroundStationId ? 'active' : ''}`}
      >
        <FontAwesomeIcon
          icon={faSatelliteDish}
          style={{ fontSize: "24px" }} // Match Material-UI icon size
        />
      </IconButton>

      {/* Ground Station Popover */}
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

          {/* Line of Sight and Visibility Cones Toggles */}
          <div className="globe-tools-group" style={{ marginBottom: "8px" }}>
            <Tooltip title="Toggle Line of Sight" arrow placement="bottom">
              <IconButton
                onClick={() => dispatch(setShowLineOfSight(!showLineOfSight))} // Dispatch Redux action
                className={`icon-button ${showLineOfSight ? 'active' : ''}`}
              >
                <VisibilityIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="Toggle Visibility Cones" arrow placement="bottom">
              <IconButton
                onClick={() => dispatch(setShowVisibilityCones(!showVisibilityCones))} // Dispatch Redux action
                className={`icon-button ${showVisibilityCones ? 'active' : ''}`}
              >
                <RadarIcon />
              </IconButton>
            </Tooltip>
          </div>

          {/* Filter and List */}
          <TextField
            fullWidth
            placeholder="Filter Ground Stations"
            value={groundStationFilter}
            onChange={(e) => setGroundStationFilter(e.target.value)}
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
            {groundStations
              .filter((gs) =>
                gs.name.toLowerCase().includes(groundStationFilter.toLowerCase())
              )
              .map((gs) => (
                <ListItem key={gs._id} disablePadding>
                  <ListItemButton
                    onClick={() => {
                      console.log("Ground Station ID:", gs);
                      dispatch(setSelectedGroundStationId(gs._id));
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
                    <ListItemText primary={gs.name} />
                  </ListItemButton>
                </ListItem>
              ))}
          </List>
        </div>
      )}
    </div>
  );
};

export default GroundStationPopover;