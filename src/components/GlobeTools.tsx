import React, { useEffect, useState } from "react";
import {
  IconButton,
  Tooltip,
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from "@mui/material";
import HistoryIcon from "@mui/icons-material/History";
import SatelliteIcon from "@mui/icons-material/SatelliteAlt";
import VisibilityIcon from "@mui/icons-material/Visibility";
import RadarIcon from "@mui/icons-material/Radar";
import PublicIcon from "@mui/icons-material/Public";
import EventIcon from "@mui/icons-material/Event"; // Import an icon for the Contact Windows button
import CodeIcon from "@mui/icons-material/Code"; // Import Console icon
import SettingsIcon from "@mui/icons-material/Settings"; // Import Settings icon
import { useDispatch } from "react-redux";
import { fetchContactWindows } from "../store/contactWindowsSlice";
import { AppDispatch } from "../store";
import SatelliteStatusTable from "./SatelliteStatusTable";
import ContactWindows from "./ContactWindows"; // Import ContactWindows component
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSatelliteDish } from "@fortawesome/free-solid-svg-icons"; // Import the satellite dish icon
import DockableComponent from "./DockableComponent";

interface GlobeToolsProps {
  groundStations: any[];
  satellites: any[];
  selectedGroundStationId: string;
  selectedSatId: string;
  setSelectedGroundStationId: (id: string) => void;
  setSelectedSatId: (id: string) => void;

  showHistory: boolean;
  setShowHistory: (value: boolean) => void;

  showTle: boolean;
  setShowTle: (value: boolean) => void;

  showLineOfSight: boolean;
  setShowLineOfSight: (value: boolean) => void;

  showVisibilityCones: boolean;
  setShowVisibilityCones: (value: boolean) => void;

  showGroundTrack: boolean;
  setShowGroundTrack: (value: boolean) => void;

  debugInfo: any; // Pass debugInfo for SatelliteStatusTable
  satPositionProperty: any;
  tleHistoryRef: React.MutableRefObject<any[]>;
  groundTrackHistoryRef: React.MutableRefObject<any[]>;
  showCesiumOptions: boolean; // Add this prop
  setShowCesiumOptions: (value: boolean) => void; // Add this prop
}

const GlobeTools: React.FC<GlobeToolsProps> = ({
  groundStations,
  satellites,
  selectedGroundStationId,
  selectedSatId,
  setSelectedGroundStationId,
  setSelectedSatId,
  showHistory,
  setShowHistory,
  showTle,
  setShowTle,
  showLineOfSight,
  setShowLineOfSight,
  showVisibilityCones,
  setShowVisibilityCones,
  showGroundTrack,
  setShowGroundTrack,
  debugInfo,
  satPositionProperty,
  tleHistoryRef,
  groundTrackHistoryRef,
  showCesiumOptions,
  setShowCesiumOptions,
}) => {
  const dispatch = useDispatch<AppDispatch>();

  // State to track which popover is open
  const [openPopover, setOpenPopover] = useState<
    | "satellite"
    | "groundStation"
    | "toolbox"
    | "contactWindow"
    | "console"
    | "cesiumOptions"
    | null
  >(null);
  const [satelliteFilter, setSatelliteFilter] = useState("");
  const [groundStationFilter, setGroundStationFilter] = useState("");

  useEffect(() => {
    if (selectedSatId && selectedGroundStationId) {
      dispatch(
        fetchContactWindows({
          satelliteId: selectedSatId,
          groundStationId: selectedGroundStationId,
        })
      );
    }
  }, [selectedSatId, selectedGroundStationId, dispatch]);

  // Determine the active page and calculate the arrow's position
  const currentPath = window.location.pathname;
  const arrowPosition = {
    "/globe": "28px", // Position under the PublicIcon button
    "/timeline": "92px", // Adjust based on the Timeline button's position
    "/sats": "156px", // Adjust based on the Satellite button's position
    "/gs": "220px", // Adjust based on the Ground Station button's position
  }[currentPath] || "16px"; // Default to Globe if no match

  return (
    <div
      style={{
        position: "absolute",
        borderTop: "1px solid #00ff00", // Green top border
        top: "64px", // Position just below the top navigation bar
        left: "0px", // Align to the left
        backgroundColor: "rgba(50, 50, 50, 0.3)", // Transparent space-grey background
        // borderRadius: "8px", // Rounded corners
        padding: "12px", // Add padding around the buttons
        zIndex: 1000, // Ensure it appears above other elements
        boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)", // Subtle shadow for depth
      }}
    >
      {/* Green Arrow */}
      <div
        style={{
          position: "absolute",
          top: "-8px", // Position above the Globe Tools panel
          left: arrowPosition, // Dynamically position the arrow
          width: "0",
          height: "0",
          borderLeft: "8px solid transparent",
          borderRight: "8px solid transparent",
          borderBottom: "8px solid #00ff00", // Green arrow
          zIndex: 1001, // Ensure it appears above the panel
        }}
      ></div>

      {/* Satellite, Ground Station, Toolbox, and Contact Windows Buttons */}
      <div
        style={{
          display: "flex",
          gap: "16px", // Space between buttons
        }}
      >
        {/* Satellite Button */}
        <div
          style={{ position: "relative" }}
          onMouseEnter={() => setOpenPopover("satellite")}
          onMouseLeave={() => setOpenPopover(null)}
        >
          <Tooltip title="Select Satellite" arrow>
            <IconButton
              style={{
                color: selectedSatId ? "#00ff00" : "#888888",
                transition: "color 0.2s ease-in-out",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#00ff00")}
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = selectedSatId
                  ? "#00ff00"
                  : "#888888")
              }
            >
              <SatelliteIcon />
            </IconButton>
          </Tooltip>

          {/* Satellite Popover */}
          {openPopover === "satellite" && (
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
                width: "200px",
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
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  marginBottom: "8px",
                }}
              >
                <Tooltip title="Toggle TLE" arrow placement="top">
                  <IconButton
                    onClick={() => setShowTle(!showTle)}
                    style={{
                      color: showTle ? "#00ff00" : "#888888", // Bright green if active, grey if inactive
                      transition: "color 0.2s ease-in-out",
                    }}
                  >
                    <SatelliteIcon />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Toggle History" arrow placement="top">
                  <IconButton
                    onClick={() => setShowHistory(!showHistory)}
                    style={{
                      color: showHistory ? "#00ff00" : "#888888", // Bright green if active, grey if inactive
                      transition: "color 0.2s ease-in-out",
                    }}
                  >
                    <HistoryIcon />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Toggle Ground Track" arrow placement="top">
                  <IconButton
                    onClick={() => setShowGroundTrack(!showGroundTrack)}
                    style={{
                      color: showGroundTrack ? "#00ff00" : "#888888", // Bright green if active, grey if inactive
                      transition: "color 0.2s ease-in-out",
                    }}
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
                {satellites.map((sat) => (
                  <ListItem key={sat._id} disablePadding>
                    <ListItemButton
                      onClick={() => {
                        setSelectedSatId(sat._id);
                        setOpenPopover(null); // Close popover after selection
                      }}
                      style={{ color: "#00ff00" }}
                    >
                      <ListItemText primary={sat.name} />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </div>
          )}
        </div>

        {/* Ground Station Button */}
        <div
          style={{ position: "relative" }}
          onMouseEnter={() => setOpenPopover("groundStation")}
          onMouseLeave={() => setOpenPopover(null)}
        >
          <Tooltip title="Select Ground Station" arrow>
            <IconButton
              style={{
                color: selectedGroundStationId ? "#00ff00" : "#888888",
                transition: "color 0.2s ease-in-out",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#00ff00")}
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = selectedGroundStationId
                  ? "#00ff00"
                  : "#888888")
              }
            >
              <FontAwesomeIcon
                icon={faSatelliteDish}
                style={{ fontSize: "24px" }} // Match Material-UI icon size
              />
            </IconButton>
          </Tooltip>

          {/* Ground Station Popover */}
          {openPopover === "groundStation" && (
            <div
              style={{
                position: "absolute",
                top: "48px", // Position below the button
                left: "0",
                backgroundColor: "rgba(13, 13, 13, 0.9)", // Console-style dark background
                border: "1px solid #00ff00", // Green border
                color: "#00ff00", // Green text
                fontFamily: "Courier New, Courier, monospace", // Console-style font
                borderRadius: "4px",
                padding: "8px",
                width: "200px",
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
                <Tooltip title="Toggle Line of Sight" arrow placement="top">
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

                <Tooltip title="Toggle Visibility Cones" arrow placement="top">
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
                {groundStations.map((gs) => (
                  <ListItem key={gs._id} disablePadding>
                    <ListItemButton
                      onClick={() => {
                        setSelectedGroundStationId(gs._id);
                        setOpenPopover(null); // Close popover after selection
                      }}
                      style={{ color: "#00ff00" }}
                    >
                      <ListItemText primary={gs.name} />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </div>
          )}
        </div>

        {/* Contact Windows Button */}
        {selectedSatId && selectedGroundStationId && (
          <div
            style={{ position: "relative" }}
            onMouseEnter={() => setOpenPopover("contactWindow")}
            onMouseLeave={() => setOpenPopover(null)}
          >
            <Tooltip title="View Contact Windows" arrow>
              <IconButton
                style={{
                  color: "#00ff00", // Bright green to make it visible
                  transition: "color 0.2s ease-in-out",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#00ff00")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#00ff00")}
              >
                <EventIcon />
              </IconButton>
            </Tooltip>

            {/* Contact Windows Popover */}
            {openPopover === "contactWindow" && (
              <div
                style={{
                  position: "absolute",
                  top: "48px",
                  left: "0",
                  backgroundColor: "rgba(13, 13, 13, 0.9)", // Match console-style dark transparent background
                  border: "1px solid #00ff00", // Green border
                  color: "#00ff00", // Green text
                  fontFamily: "Courier New, Courier, monospace", // Console-style font
                  borderRadius: "4px",
                  padding: "16px",
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
                <ContactWindows
                  satelliteId={selectedSatId}
                  groundStationId={selectedGroundStationId}
                />
              </div>
            )}
          </div>
        )}

        {/* Console Button */}
        <div
          style={{ position: "relative" }}
          onMouseEnter={() => setOpenPopover("console")}
          onMouseLeave={() => setOpenPopover(null)}
        >
          <Tooltip title="Open Console" arrow>
            <IconButton
              style={{
                color:
                  selectedSatId || selectedGroundStationId ? "#00ff00" : "#555555",
                transition: "color 0.2s ease-in-out",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#00ff00")}
              onMouseLeave={(e) =>
                (e.currentTarget.style.color =
                  selectedSatId || selectedGroundStationId ? "#00ff00" : "#555555")
              }
            >
              <CodeIcon />
            </IconButton>
          </Tooltip>

          {/* Console Popover */}
          {openPopover === "console" && (
            <DockableComponent
              popoverStyle={{
                position: "absolute",
                backgroundColor: "rgba(13, 13, 13, 0.9)",
                border: "1px solid #00ff00",
                color: "#00ff00",
                fontFamily: "Courier New, Courier, monospace",
                borderRadius: "4px",
                padding: "8px",
                width: "350px",
                zIndex: 1001,
              }}
              content={
                <SatelliteStatusTable
                  debugInfo={debugInfo}
                  groundStations={groundStations}
                  satellites={satellites}
                  selectedSatId={selectedSatId}
                  selectedGroundStationId={selectedGroundStationId}
                  satPositionProperty={satPositionProperty}
                  tleHistoryRef={tleHistoryRef}
                  groundTrackHistoryRef={groundTrackHistoryRef}
                />
              }
            />
          )}
        </div>

        {/* Cesium Options Button */}
        <div
          style={{ position: "relative" }}
          onMouseEnter={() => setOpenPopover("cesiumOptions")}
          onMouseLeave={() => setOpenPopover(null)}
        >
          <Tooltip title="Cesium Options" arrow>
            <IconButton
              style={{
                color: "#888888",
                transition: "color 0.2s ease-in-out",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#00ff00")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#888888")}
            >
              <SettingsIcon />
            </IconButton>
          </Tooltip>

          {/* Cesium Options Popover */}
          {openPopover === "cesiumOptions" && (
            <div
              style={{
                position: "absolute",
                top: "48px",
                left: "0",
                backgroundColor: "rgba(13, 13, 13, 0.9)", // Console-style dark background
                border: "1px solid #00ff00", // Green border
                color: "#00ff00", // Green text
                fontFamily: "Courier New, Courier, monospace", // Console-style font
                borderRadius: "4px",
                padding: "8px",
                width: "200px",
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

              {/* Toggle Cesium Options */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginTop: "40px",
                }}
              >
                <Tooltip title="Toggle Cesium Options" arrow>
                  <IconButton
                    onClick={() => setShowCesiumOptions(!showCesiumOptions)}
                    style={{
                      color: showCesiumOptions ? "#00ff00" : "#888888",
                      transition: "color 0.2s ease-in-out",
                    }}
                  >
                    <SettingsIcon />
                  </IconButton>
                </Tooltip>
                <span style={{ fontSize: "14px" }}>
                  {showCesiumOptions ? "Disable Options" : "Enable Options"}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GlobeTools;
