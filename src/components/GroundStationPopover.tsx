import React, { useState } from "react";
import { IconButton, Tooltip, TextField, List, ListItem, ListItemButton, ListItemText } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import RadarIcon from "@mui/icons-material/Radar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSatelliteDish } from "@fortawesome/free-solid-svg-icons";

interface GroundStationPopoverProps {
  groundStations: any[];
  selectedGroundStationId: string;
  setSelectedGroundStationId: (id: string) => void;
  showLineOfSight: boolean;
  setShowLineOfSight: (value: boolean) => void;
  showVisibilityCones: boolean;
  setShowVisibilityCones: (value: boolean) => void;
}

const GroundStationPopover: React.FC<GroundStationPopoverProps> = ({
  groundStations,
  selectedGroundStationId,
  setSelectedGroundStationId,
  showLineOfSight,
  setShowLineOfSight,
  showVisibilityCones,
  setShowVisibilityCones,
}) => {
  const [openPopover, setOpenPopover] = useState<boolean>(false);
  const [groundStationFilter, setGroundStationFilter] = useState<string>("");

  return (
    <div
      style={{ position: "relative" }}
      onMouseEnter={() => setOpenPopover(true)}
      onMouseLeave={() => setOpenPopover(false)}
    >
      {/* Ground Station Button */}
      <IconButton
        style={{
          color: selectedGroundStationId ? "#00ff00" : "#888888",
          transition: "color 0.2s ease-in-out",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#00ff00")}
        onMouseLeave={(e) =>
          (e.currentTarget.style.color = selectedGroundStationId ? "#00ff00" : "#888888")
        }
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
            top: "48px",
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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              marginBottom: "8px",
            }}
          >
            <Tooltip title="Toggle Line of Sight" arrow placement="bottom">
              <IconButton
                onClick={() => setShowLineOfSight(!showLineOfSight)}
                style={{
                  color: showLineOfSight ? "#00ff00" : "#888888", // Bright green if active, grey if inactive
                  transition: "color 0.2s ease-in-out",
                }}
              >
                <VisibilityIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="Toggle Visibility Cones" arrow placement="bottom">
              <IconButton
                onClick={() => setShowVisibilityCones(!showVisibilityCones)}
                style={{
                  color: showVisibilityCones ? "#00ff00" : "#888888", // Bright green if active, grey if inactive
                  transition: "color 0.2s ease-in-out",
                }}
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
                      setSelectedGroundStationId(gs._id);
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