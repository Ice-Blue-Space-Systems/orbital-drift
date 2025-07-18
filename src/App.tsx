import React from "react";
import { ToastContainer } from "react-toastify";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { AppBar, Toolbar, IconButton, Tooltip, Box } from "@mui/material";
import PublicIcon from "@mui/icons-material/Public";
import TimelineIcon from "@mui/icons-material/Timeline";
import SatelliteIcon from "@mui/icons-material/SatelliteAlt";
import RadarIcon from "@mui/icons-material/Radar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserAstronaut } from "@fortawesome/free-solid-svg-icons";
import { faBolt } from "@fortawesome/free-solid-svg-icons"; // Import the slanted lightning bolt icon
import { useSelector, useDispatch } from "react-redux";

import GlobePage from "./GlobePage";
import TimelinePage from "./TimelinePage";
import SatsPage from "./SatsPage";
import GSPage from "./GSPage";
import CesiumControlPanel from "./components/CesiumControlPanel";
import { RootState } from "./store";
import { setLiveMode } from "./store/mongoSlice";
import "./App.css";
import { selectCesiumClockUtc } from "./store/selectors/cesiumClockSelectors";
import { useGlobalClock } from "./hooks/useGlobalClock";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";

/** A simple top nav with the four route icons. */
function GlobalAppBar() {
  const dispatch = useDispatch();
  const liveMode = useSelector((state: RootState) => state.mongo.liveMode); // Get liveMode from Redux
  const utc = useSelector(selectCesiumClockUtc);
  const cesiumMultiplier = useSelector((state: RootState) => state.cesiumClock.multiplier);
  const navigate = useNavigate();
  const currentPath = window.location.pathname;
  const { theme } = useTheme();

  const [accountPopoverOpen, setAccountPopoverOpen] = React.useState(false);

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
        backgroundColor: theme.navBackground,
        boxShadow: `0 2px 10px ${theme.glowColor}`,
        borderBottom: `1px solid ${theme.borderGradient}`,
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
              color: currentPath === "/globe" ? theme.primary : theme.textSecondary,
              transition: "color 0.2s ease-in-out",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = theme.primary)}
            onMouseLeave={(e) =>
              (e.currentTarget.style.color =
                currentPath === "/globe" ? theme.primary : theme.textSecondary)
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
              color: currentPath === "/timeline" ? theme.primary : theme.textSecondary,
              transition: "color 0.2s ease-in-out",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = theme.primary)}
            onMouseLeave={(e) =>
              (e.currentTarget.style.color =
                currentPath === "/timeline" ? theme.primary : theme.textSecondary)
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
              color: currentPath === "/sats" ? theme.primary : theme.textSecondary,
              transition: "color 0.2s ease-in-out",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = theme.primary)}
            onMouseLeave={(e) =>
              (e.currentTarget.style.color =
                currentPath === "/sats" ? theme.primary : theme.textSecondary)
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
              color: currentPath === "/gs" ? theme.primary : theme.textSecondary,
              transition: "color 0.2s ease-in-out",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = theme.primary)}
            onMouseLeave={(e) =>
              (e.currentTarget.style.color =
                currentPath === "/gs" ? theme.primary : theme.textSecondary)
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
            onMouseEnter={(e) => (e.currentTarget.style.color = theme.accent)} // Brighter accent on hover
            onMouseLeave={(e) =>
              (e.currentTarget.style.color =
                currentPath === "/gs" ? theme.primary : theme.textSecondary)
            }
          >
            <FontAwesomeIcon
              icon={faBolt}
              className="fa-bolt" // Add class for shimmer effect
              style={{
                fontSize: "24px", // Adjust size
                color: theme.accent, // Default accent color
                transition: "color 0.2s ease-in-out", // Smooth transition
              }}
            />
          </IconButton>
        </Tooltip>

        {/* UTC Clock */}
        <div
          style={{
            color: theme.primary, // Theme text
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
            <div style={{ fontSize: "12px", color: theme.warning }}>
              {cesiumMultiplier}x speed
            </div>
          )}
        </div>

        {/* Theme Switcher */}
        <div
          style={{ position: "relative", marginLeft: "auto" }}
        >
          <Tooltip title="Switch Theme" arrow>
            <IconButton
              style={{
                color: theme.textSecondary,
                transition: "color 0.2s ease-in-out",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = theme.primary)}
              onMouseLeave={(e) => (e.currentTarget.style.color = theme.textSecondary)}
            >
              {/* <Brightness4Icon style={{ fontSize: "24px" }} /> */}
              <span>🎨</span>
            </IconButton>
          </Tooltip>

          {/* Theme popover disabled - using global theme from CesiumControlPanel */}
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
              onMouseEnter={(e) => (e.currentTarget.style.color = theme.primary)}
              onMouseLeave={(e) => (e.currentTarget.style.color = theme.textSecondary)}
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
                backgroundColor: theme.backgroundDark, // Theme dark background
                border: `1px solid ${theme.primary}`, // Theme border
                color: theme.primary, // Theme text
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
                  borderBottom: `8px solid ${theme.primary}`, // Theme arrow
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
  const { theme } = useTheme();

  // Global clock fallback for when no Cesium viewer is active
  useGlobalClock();

  return (
    <Box sx={{
      minHeight: '100vh',
      background: theme.appBackground,
      transition: 'background 0.5s ease',
    }}>
      {/* Global Navigation Bar */}
      <GlobalAppBar />
      
      {/* Global Cesium Control Panel - appears on all pages */}
      <CesiumControlPanel position="top-right" />
      
      <Routes>
        <Route path="/globe" element={<GlobePage />} />
        {/* Other routes */}
        <Route path="/" element={<Navigate to="/globe" replace />} />
        <Route path="/timeline" element={<TimelinePage />} />
        <Route path="/sats" element={<SatsPage />} />
        <Route path="/gs" element={<GSPage />} />
      </Routes>
    </Box>
  );
}

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <div>
        <ToastContainer />
        <Router>
          <AppContent />
        </Router>
      </div>
    </ThemeProvider>
  );
};

export default App;
