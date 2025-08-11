import React from "react";
import { ToastContainer } from "react-toastify";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { AppBar, Toolbar, IconButton, Tooltip, Box, styled } from "@mui/material";
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

// Custom Glassmorphic Tooltip Component
const GlassmorphicTooltip: React.FC<{ title: string; children: React.ReactElement }> = ({ 
  title, 
  children 
}) => {
  const { theme } = useTheme();
  
  const StyledTooltip = styled(({ className, ...props }: any) => (
    <Tooltip {...props} classes={{ popper: className }} />
  ))(() => ({
    [`& .MuiTooltip-tooltip`]: {
      backgroundColor: 'transparent',
      background: theme.background,
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: `1px solid rgba(${theme.primary.replace('#', '').match(/.{2}/g)?.map(hex => parseInt(hex, 16)).join(', ')}, 0.3)`,
      borderRadius: '8px',
      boxShadow: `
        0 8px 32px rgba(0, 0, 0, 0.4),
        0 0 20px rgba(${theme.primary.replace('#', '').match(/.{2}/g)?.map(hex => parseInt(hex, 16)).join(', ')}, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.1)
      `,
      color: theme.primary,
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: '12px',
      fontWeight: 'bold',
      textShadow: `0 0 10px ${theme.primary}`,
      maxWidth: 220,
      padding: '8px 12px',
    },
    [`& .MuiTooltip-arrow`]: {
      color: 'transparent',
      '&::before': {
        backgroundColor: 'transparent',
        background: theme.background,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid rgba(${theme.primary.replace('#', '').match(/.{2}/g)?.map(hex => parseInt(hex, 16)).join(', ')}, 0.3)`,
        boxShadow: `
          0 4px 16px rgba(0, 0, 0, 0.3),
          0 0 10px rgba(${theme.primary.replace('#', '').match(/.{2}/g)?.map(hex => parseInt(hex, 16)).join(', ')}, 0.2)
        `,
      },
    },
  }));

  return (
    <StyledTooltip title={title} arrow>
      {children}
    </StyledTooltip>
  );
};

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
        <GlassmorphicTooltip title="Globe">
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
        </GlassmorphicTooltip>

        {/* Timeline Icon */}
        <GlassmorphicTooltip title="Timeline">
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
        </GlassmorphicTooltip>

        {/* Satellites Icon */}
        <GlassmorphicTooltip title="Satellites">
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
        </GlassmorphicTooltip>

        {/* Ground Stations Icon */}
        <GlassmorphicTooltip title="Ground Stations">
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
        </GlassmorphicTooltip>

        {/* Live Mode Toggle */}
        <GlassmorphicTooltip title="Live Mode">
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
        </GlassmorphicTooltip>

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

        {/* Account Actions Button */}
        <div
          style={{ position: "relative", marginLeft: "auto" }}
          onMouseEnter={handleAccountPopoverOpen}
          onMouseLeave={handleAccountPopoverClose}
        >
          <GlassmorphicTooltip title="Account Actions">
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
          </GlassmorphicTooltip>

          {/* Account Actions Popover */}
          {accountPopoverOpen && (
            <div
              style={{
                position: "absolute",
                top: "48px",
                right: "0",
                background: theme.background,
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)", // Safari support
                border: `1px solid rgba(${theme.primary.replace('#', '').match(/.{2}/g)?.map(hex => parseInt(hex, 16)).join(', ')}, 0.3)`,
                borderRadius: "12px",
                boxShadow: `
                  0 8px 32px rgba(0, 0, 0, 0.4),
                  0 0 20px rgba(${theme.primary.replace('#', '').match(/.{2}/g)?.map(hex => parseInt(hex, 16)).join(', ')}, 0.2),
                  inset 0 1px 0 rgba(255, 255, 255, 0.1)
                `,
                color: theme.primary,
                fontFamily: "Courier New, Courier, monospace",
                padding: "0",
                width: "280px",
                zIndex: 9999, // Highest z-index to appear above everything
                overflow: "hidden",
              }}
            >
              {/* Glassmorphic arrow */}
              <div
                style={{
                  position: "absolute",
                  top: "-6px",
                  right: "20px",
                  width: "12px",
                  height: "12px",
                  background: theme.background,
                  backdropFilter: "blur(20px)",
                  border: `1px solid rgba(${theme.primary.replace('#', '').match(/.{2}/g)?.map(hex => parseInt(hex, 16)).join(', ')}, 0.3)`,
                  transform: "rotate(45deg)",
                  borderBottom: "none",
                  borderRight: "none",
                }}
              ></div>

              {/* Header */}
              <div
                style={{
                  padding: "16px 20px",
                  borderBottom: `1px solid rgba(${theme.primary.replace('#', '').match(/.{2}/g)?.map(hex => parseInt(hex, 16)).join(', ')}, 0.2)`,
                  background: "linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    fontSize: "14px",
                    fontWeight: "bold",
                    color: theme.primary,
                    textShadow: `0 0 10px ${theme.primary}`,
                  }}
                >
                  <FontAwesomeIcon icon={faUserAstronaut} style={{ fontSize: "18px" }} />
                  <span>Mission Control</span>
                </div>
              </div>

              {/* Menu Items */}
              <div style={{ padding: "8px 0" }}>
                {/* Sign In / Sign Up */}
                <div
                  style={{
                    padding: "12px 20px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    borderBottom: `1px solid rgba(${theme.primary.replace('#', '').match(/.{2}/g)?.map(hex => parseInt(hex, 16)).join(', ')}, 0.1)`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                    e.currentTarget.style.transform = "translateX(4px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.transform = "translateX(0)";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "13px" }}>
                    <span style={{ fontSize: "16px" }}>🚀</span>
                    <div>
                      <div style={{ fontWeight: "bold" }}>Sign In / Register</div>
                      <div style={{ fontSize: "11px", opacity: 0.7, marginTop: "2px" }}>
                        Access mission profiles
                      </div>
                    </div>
                  </div>
                </div>

                {/* Profile Management */}
                <div
                  style={{
                    padding: "12px 20px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    borderBottom: `1px solid rgba(${theme.primary.replace('#', '').match(/.{2}/g)?.map(hex => parseInt(hex, 16)).join(', ')}, 0.1)`,
                    opacity: 0.5, // Disabled for now
                  }}
                  onMouseEnter={(e) => {
                    if (e.currentTarget.style.opacity !== "0.5") {
                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                      e.currentTarget.style.transform = "translateX(4px)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.transform = "translateX(0)";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "13px" }}>
                    <span style={{ fontSize: "16px" }}>👤</span>
                    <div>
                      <div style={{ fontWeight: "bold" }}>Profile Settings</div>
                      <div style={{ fontSize: "11px", opacity: 0.7, marginTop: "2px" }}>
                        Manage astronaut profile
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mission History */}
                <div
                  style={{
                    padding: "12px 20px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    borderBottom: `1px solid rgba(${theme.primary.replace('#', '').match(/.{2}/g)?.map(hex => parseInt(hex, 16)).join(', ')}, 0.1)`,
                    opacity: 0.5, // Disabled for now
                  }}
                  onMouseEnter={(e) => {
                    if (e.currentTarget.style.opacity !== "0.5") {
                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                      e.currentTarget.style.transform = "translateX(4px)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.transform = "translateX(0)";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "13px" }}>
                    <span style={{ fontSize: "16px" }}>📊</span>
                    <div>
                      <div style={{ fontWeight: "bold" }}>Mission History</div>
                      <div style={{ fontSize: "11px", opacity: 0.7, marginTop: "2px" }}>
                        View past operations
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preferences */}
                <div
                  style={{
                    padding: "12px 20px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    borderBottom: `1px solid rgba(${theme.primary.replace('#', '').match(/.{2}/g)?.map(hex => parseInt(hex, 16)).join(', ')}, 0.1)`,
                    opacity: 0.5, // Disabled for now
                  }}
                  onMouseEnter={(e) => {
                    if (e.currentTarget.style.opacity !== "0.5") {
                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                      e.currentTarget.style.transform = "translateX(4px)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.transform = "translateX(0)";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "13px" }}>
                    <span style={{ fontSize: "16px" }}>⚙️</span>
                    <div>
                      <div style={{ fontWeight: "bold" }}>Preferences</div>
                      <div style={{ fontSize: "11px", opacity: 0.7, marginTop: "2px" }}>
                        System configuration
                      </div>
                    </div>
                  </div>
                </div>

                {/* Help & Support */}
                <div
                  style={{
                    padding: "12px 20px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                    e.currentTarget.style.transform = "translateX(4px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.transform = "translateX(0)";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "13px" }}>
                    <span style={{ fontSize: "16px" }}>🆘</span>
                    <div>
                      <div style={{ fontWeight: "bold" }}>Help & Support</div>
                      <div style={{ fontSize: "11px", opacity: 0.7, marginTop: "2px" }}>
                        Mission assistance
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div
                style={{
                  padding: "12px 20px",
                  borderTop: `1px solid rgba(${theme.primary.replace('#', '').match(/.{2}/g)?.map(hex => parseInt(hex, 16)).join(', ')}, 0.2)`,
                  background: theme.backgroundSecondary,
                  fontSize: "10px",
                  textAlign: "center",
                  opacity: 0.8,
                }}
              >
                <div>Orbital Drift Mission Control</div>
                <div style={{ marginTop: "2px", opacity: 0.6 }}>v1.0.0 Beta</div>
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
