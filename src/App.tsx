import React, { useState } from "react";
import { ToastContainer } from "react-toastify";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { AppBar, Toolbar, IconButton, Tooltip } from "@mui/material";
import PublicIcon from "@mui/icons-material/Public";
import TimelineIcon from "@mui/icons-material/Timeline";
import SatelliteIcon from "@mui/icons-material/SatelliteAlt";
import RadarIcon from "@mui/icons-material/Radar";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserAstronaut } from "@fortawesome/free-solid-svg-icons";
import { faBolt } from "@fortawesome/free-solid-svg-icons"; // Import the slanted lightning bolt icon
import { useSelector, useDispatch } from "react-redux";

import GlobePage from "./GlobePage";
import TimelinePage from "./TimelinePage";
import SatsPage from "./SatsPage";
import GSPage from "./GSPage";
import SimulationSpeedDial from "./components/SimulationSpeedDial";
import { RootState } from "./store";
import { setLiveMode } from "./store/mongoSlice";
import "./App.css";
import { selectCesiumClockUtc } from "./store/selectors/cesiumClockSelectors";
import { useGlobalClock } from "./hooks/useGlobalClock";

/** A simple top nav with the four route icons. */
function GlobalAppBar({
  currentTheme,
  setTheme,
}: {
  currentTheme: string;
  setTheme: (theme: string) => void;
}) {
  const dispatch = useDispatch();
  const liveMode = useSelector((state: RootState) => state.mongo.liveMode); // Get liveMode from Redux
  const utc = useSelector(selectCesiumClockUtc);
  const cesiumMultiplier = useSelector((state: RootState) => state.cesiumClock.multiplier);
  const navigate = useNavigate();
  const currentPath = window.location.pathname;

  const [themePopoverOpen, setThemePopoverOpen] = React.useState(false);
  const [accountPopoverOpen, setAccountPopoverOpen] = React.useState(false);

  const handleThemePopoverOpen = () => {
    setThemePopoverOpen(true);
  };

  const handleThemePopoverClose = () => {
    setThemePopoverOpen(false);
  };

  const handleAccountPopoverOpen = () => {
    setAccountPopoverOpen(true);
  };

  const handleAccountPopoverClose = () => {
    setAccountPopoverOpen(false);
  };

  return (
    <AppBar
      position="static"
      style={{
        backgroundColor: "rgba(13, 13, 13, 0.9)", // Transparent console-style background
        boxShadow: "none",
      }}
    >
      <Toolbar
        style={{
          display: "flex",
          gap: "16px", // Add 16px spacing between buttons
          justifyContent: "flex-start", // Align buttons to the left
          padding: "0 16px", // Add padding to match the Globe Tools panel
        }}
      >
        {/* Globe Icon */}
        <Tooltip title="Globe" arrow>
          <IconButton
            onClick={() => navigate("/globe")}
            style={{
              color: currentPath === "/globe" ? "#00ff00" : "#888888",
              transition: "color 0.2s ease-in-out",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#00ff00")}
            onMouseLeave={(e) =>
              (e.currentTarget.style.color =
                currentPath === "/globe" ? "#00ff00" : "#888888")
            }
          >
            <PublicIcon style={{ fontSize: "24px" }} />
          </IconButton>
        </Tooltip>

        {/* Timeline Icon */}
        <Tooltip title="Timeline" arrow>
          <IconButton
            onClick={() => navigate("/timeline")}
            style={{
              color: currentPath === "/timeline" ? "#00ff00" : "#888888",
              transition: "color 0.2s ease-in-out",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#00ff00")}
            onMouseLeave={(e) =>
              (e.currentTarget.style.color =
                currentPath === "/timeline" ? "#00ff00" : "#888888")
            }
          >
            <TimelineIcon style={{ fontSize: "24px" }} />
          </IconButton>
        </Tooltip>

        {/* Satellites Icon */}
        <Tooltip title="Satellites" arrow>
          <IconButton
            onClick={() => navigate("/sats")}
            style={{
              color: currentPath === "/sats" ? "#00ff00" : "#888888",
              transition: "color 0.2s ease-in-out",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#00ff00")}
            onMouseLeave={(e) =>
              (e.currentTarget.style.color =
                currentPath === "/sats" ? "#00ff00" : "#888888")
            }
          >
            <SatelliteIcon style={{ fontSize: "24px" }} />
          </IconButton>
        </Tooltip>

        {/* Ground Stations Icon */}
        <Tooltip title="Ground Stations" arrow>
          <IconButton
            onClick={() => navigate("/gs")}
            style={{
              color: currentPath === "/gs" ? "#00ff00" : "#888888",
              transition: "color 0.2s ease-in-out",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#00ff00")}
            onMouseLeave={(e) =>
              (e.currentTarget.style.color =
                currentPath === "/gs" ? "#00ff00" : "#888888")
            }
          >
            <RadarIcon style={{ fontSize: "24px" }} />
          </IconButton>
        </Tooltip>

        {/* Live Mode Toggle */}
        <Tooltip title="Live Mode" arrow>
          <IconButton
            onClick={() => dispatch(setLiveMode(!liveMode))} // Toggle liveMode
            className="live-mode-button" // Add a class for styling
            onMouseEnter={(e) => (e.currentTarget.style.color = "#FF00FF")} // Brighter purple on hover
            onMouseLeave={(e) =>
              (e.currentTarget.style.color =
                currentPath === "/gs" ? "#00ff00" : "#888888")
            }
          >
            <FontAwesomeIcon
              icon={faBolt}
              className="fa-bolt" // Add class for shimmer effect
              style={{
                fontSize: "24px", // Adjust size
                color: "#800080", // Default bright purple
                transition: "color 0.2s ease-in-out", // Smooth transition
              }}
            />
          </IconButton>
        </Tooltip>

        {/* UTC Clock */}
        <div
          style={{
            color: "#00ff00", // Green text
            fontFamily: "Courier New, Courier, monospace", // Console-style font
            fontSize: "16px", // Slightly larger text
            marginLeft: "16px", // Add spacing after the icons
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
          }}
        >
          <div>{utc}</div>
          {cesiumMultiplier !== 1 && (
            <div style={{ fontSize: "12px", color: "#ffff00" }}>
              {cesiumMultiplier}x speed
            </div>
          )}
        </div>

        {/* Theme Switcher */}
        <div
          style={{ position: "relative", marginLeft: "auto" }}
          onMouseEnter={handleThemePopoverOpen}
          onMouseLeave={handleThemePopoverClose}
        >
          <Tooltip title="Switch Theme" arrow>
            <IconButton
              style={{
                color: "#888888",
                transition: "color 0.2s ease-in-out",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#00ff00")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#888888")}
            >
              <Brightness4Icon style={{ fontSize: "24px" }} />
            </IconButton>
          </Tooltip>

          {/* Theme Switcher Popover */}
          {themePopoverOpen && (
            <div
              style={{
                position: "absolute",
                top: "48px",
                right: "0",
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
                  right: "16px",
                  width: "0",
                  height: "0",
                  borderLeft: "8px solid transparent",
                  borderRight: "8px solid transparent",
                  borderBottom: "8px solid #00ff00", // Green arrow
                }}
              ></div>

              {/* Theme Options */}
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                {/* Console Theme */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                  }}
                  onClick={() => setTheme("console")}
                >
                  <div
                    style={{
                      width: "16px",
                      height: "16px",
                      backgroundColor: "#00ff00", // Green swatch
                      borderRadius: "50%",
                      border:
                        currentTheme === "console"
                          ? "2px solid #00ff00"
                          : "2px solid transparent",
                    }}
                  ></div>
                  <span style={{ fontSize: "14px" }}>Console Theme</span>
                </div>

                {/* Light Theme */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                  }}
                  onClick={() => setTheme("light")}
                >
                  <div
                    style={{
                      width: "16px",
                      height: "16px",
                      backgroundColor: "#ffffff", // White swatch
                      borderRadius: "50%",
                      border:
                        currentTheme === "light"
                          ? "2px solid #00ff00"
                          : "2px solid transparent",
                    }}
                  ></div>
                  <span style={{ fontSize: "14px" }}>Light Theme</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Account Actions Button */}
        <div
          style={{ position: "relative", marginLeft: "16px" }}
          onMouseEnter={handleAccountPopoverOpen}
          onMouseLeave={handleAccountPopoverClose}
        >
          <Tooltip title="Account Actions" arrow>
            <IconButton
              style={{
                color: "#888888",
                transition: "color 0.2s ease-in-out",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#00ff00")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#888888")}
            >
              <FontAwesomeIcon
                icon={faUserAstronaut}
                style={{ fontSize: "24px" }}
              />
            </IconButton>
          </Tooltip>

          {/* Account Actions Popover */}
          {accountPopoverOpen && (
            <div
              style={{
                position: "absolute",
                top: "48px",
                right: "0",
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
                  right: "16px",
                  width: "0",
                  height: "0",
                  borderLeft: "8px solid transparent",
                  borderRight: "8px solid transparent",
                  borderBottom: "8px solid #00ff00", // Green arrow
                }}
              ></div>

              {/* Empty Box for Now */}
              <div style={{ textAlign: "center", padding: "16px" }}>
                Account Actions Placeholder
              </div>
            </div>
          )}
        </div>
      </Toolbar>
    </AppBar>
  );
}

// Component inside Router that can use useLocation
function AppContent() {
  const [currentTheme, setCurrentTheme] = useState<string>("console");

  // Global clock fallback for when no Cesium viewer is active
  useGlobalClock();

  return (
    <>
      {/* Global Navigation Bar */}
      <GlobalAppBar currentTheme={currentTheme} setTheme={setCurrentTheme} />
      
      {/* Global Simulation Speed Dial - appears on all pages */}
      <SimulationSpeedDial 
        size={90}
        position="top-right"
        minSpeed={0.1}
        maxSpeed={1000}
      />
      
      <Routes>
        <Route path="/globe" element={<GlobePage />} />
        {/* Other routes */}
        <Route path="/" element={<Navigate to="/globe" replace />} />
        <Route path="/timeline" element={<TimelinePage />} />
        <Route path="/sats" element={<SatsPage />} />
        <Route path="/gs" element={<GSPage />} />
      </Routes>
    </>
  );
}

const App: React.FC = () => {
  return (
    <div>
      <ToastContainer />
      <Router>
        <AppContent />
      </Router>
    </div>
  );
};

export default App;
