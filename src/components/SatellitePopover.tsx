import React, { useState, useRef, useEffect } from "react";
import { IconButton, Tooltip, TextField, List, ListItem, ListItemButton, ListItemText, Typography, Chip, Box, Divider } from "@mui/material";
import SatelliteIcon from "@mui/icons-material/SatelliteAlt";
import HistoryIcon from "@mui/icons-material/History";
import PublicIcon from "@mui/icons-material/Public";
import MyLocationIcon from "@mui/icons-material/MyLocation"; // For nadir lines - represents targeting/location
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../store";
import { setSelectedSatId, setShowHistory, setShowTle, setShowGroundTrack, setShowNadirLines } from "../store/mongoSlice";
import { fetchCelesTrakSatellites, DisplaySatellite } from "../utils/satelliteDataUtils";
import { useTheme } from "../contexts/ThemeContext";

const SatellitePopover: React.FC = () => {
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const [openPopover, setOpenPopover] = useState<boolean>(false);
  const [satelliteFilter, setSatelliteFilter] = useState<string>("");
  const [celestrakSatellites, setCelestrakSatellites] = useState<DisplaySatellite[]>([]);
  const [loadingCelestrak, setLoadingCelestrak] = useState<boolean>(false);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { satellites, selectedSatId } = useSelector((state: RootState) => state.mongo);
  const showHistoryState = useSelector((state: RootState) => state.mongo.showHistory);
  const showTleState = useSelector((state: RootState) => state.mongo.showTle);
  const showGroundTrackState = useSelector((state: RootState) => state.mongo.showGroundTrack);
  const showNadirLinesState = useSelector((state: RootState) => state.mongo.showNadirLines);

  // Load CelesTrak data when popover opens
  useEffect(() => {
    if (openPopover && celestrakSatellites.length === 0) {
      const loadCelestrakData = async () => {
        setLoadingCelestrak(true);
        try {
          const data = await fetchCelesTrakSatellites();
          setCelestrakSatellites(data);
        } catch (error) {
          console.error("Failed to load CelesTrak data:", error);
        } finally {
          setLoadingCelestrak(false);
        }
      };
      loadCelestrakData();
    }
  }, [openPopover, celestrakSatellites.length]);

  // Filter managed satellites (MongoDB)
  const filteredManagedSats = satellites.filter((sat) =>
    sat.name.toLowerCase().includes(satelliteFilter.toLowerCase())
  );

  // Filter discoverable satellites (CelesTrak) - exclude ones already in MongoDB
  const managedSatNames = new Set(satellites.map(sat => sat.name.toLowerCase()));
  const filteredDiscoverableSats = celestrakSatellites
    .filter((sat) => 
      sat.name.toLowerCase().includes(satelliteFilter.toLowerCase()) && 
      !managedSatNames.has(sat.name.toLowerCase())
    )
    .slice(0, 10); // Limit to first 10 results to avoid overwhelming UI

  const handleQuickAdd = async (satellite: DisplaySatellite) => {
    try {
      // POST new satellite to API
      const response = await fetch('/api/satellites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: satellite.name,
          noradId: satellite.noradId,
          country: satellite.country || 'Unknown',
          launchDate: satellite.launchDate,
          orbitType: satellite.orbitType || 'Unknown',
          status: satellite.status,
          description: `Added from CelesTrak - ${satellite.description || 'Satellite from CelesTrak database'}`
        }),
      });

      if (response.ok) {
        const newSat = await response.json();
        // Refresh the satellites data from Redux
        // You might want to dispatch a refresh action here
        window.location.reload(); // Simple refresh for now
      }
    } catch (error) {
      console.error('Failed to add satellite:', error);
    }
  };

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
            top: "46px",
            left: "0",
            backgroundColor: theme.cardBackground,
            border: `1px solid ${theme.borderGradient}`,
            color: theme.textPrimary,
            fontFamily: "Courier New, Courier, monospace",
            borderRadius: "8px",
            padding: "12px",
            width: "420px",
            maxHeight: "70vh", // Limit to 70% of viewport height
            zIndex: 1001,
            boxShadow: "0 8px 32px rgba(0, 255, 65, 0.15)",
            backdropFilter: "blur(10px)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden", // Prevent outer overflow
          }}
        >
          {/* Arrow */}
          <div
            style={{
              position: "absolute",
              top: "-9px",
              left: "20px",
              width: "0",
              height: "0",
              borderLeft: "9px solid transparent",
              borderRight: "9px solid transparent",
              borderBottom: "9px solid rgba(0, 255, 65, 0.4)",
              filter: "drop-shadow(0 -2px 4px rgba(0, 255, 65, 0.2))",
            }}
          ></div>

          {/* Fixed Header Section */}
          <div style={{ flexShrink: 0 }}>
            {/* Show TLE, History, and Ground Track Toggles */}
            <div className="globe-tools-group" style={{ marginBottom: "12px" }}>
              {/* Toggle TLE */}
              <Tooltip title="Toggle TLE" arrow placement="bottom">
                <IconButton
                  onClick={() => dispatch(setShowTle(!showTleState))}
                  className={`icon-button ${showTleState ? 'active' : ''}`}
                >
                  <SatelliteIcon />
                </IconButton>
              </Tooltip>

              {/* Toggle History */}
              <Tooltip title="Toggle History" arrow placement="bottom">
                <IconButton
                  onClick={() => dispatch(setShowHistory(!showHistoryState))}
                  className={`icon-button ${showHistoryState ? 'active' : ''}`}
                >
                  <HistoryIcon />
                </IconButton>
              </Tooltip>

              {/* Toggle Ground Track */}
              <Tooltip title="Toggle Ground Track" arrow placement="bottom">
                <IconButton
                  onClick={() => dispatch(setShowGroundTrack(!showGroundTrackState))}
                  className={`icon-button ${showGroundTrackState ? 'active' : ''}`}
                >
                  <PublicIcon />
                </IconButton>
              </Tooltip>

              {/* Toggle Nadir Lines */}
              <Tooltip title="Toggle Nadir Lines (Satellite to Ground)" arrow placement="bottom">
                <IconButton
                  onClick={() => dispatch(setShowNadirLines(!showNadirLinesState))}
                  className={`icon-button ${showNadirLinesState ? 'active' : ''}`}
                >
                  <MyLocationIcon />
                </IconButton>
              </Tooltip>
            </div>

            {/* Search Field */}
            <TextField
              fullWidth
              placeholder="Search Satellites..."
              value={satelliteFilter}
              onChange={(e) => setSatelliteFilter(e.target.value)}
              sx={{
                marginBottom: "12px",
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "rgba(30, 30, 30, 0.8)",
                  color: "#00ff41",
                  fontFamily: "'Courier New', Courier, monospace",
                  fontSize: "0.9rem",
                  "& fieldset": {
                    borderColor: "rgba(0, 255, 65, 0.3)",
                  },
                  "&:hover fieldset": {
                    borderColor: "rgba(0, 255, 65, 0.5)",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#00ff41",
                    boxShadow: "0 0 8px rgba(0, 255, 65, 0.3)",
                  },
                },
                "& .MuiInputBase-input::placeholder": {
                  color: "rgba(0, 255, 65, 0.6)",
                  opacity: 1,
                },
              }}
            />
          </div>

          {/* Scrollable Content Area */}
          <div 
            style={{ 
              flex: 1,
              overflowY: "auto",
              overflowX: "hidden",
              paddingRight: "4px", // Space for scrollbar
            }}
            className="satellite-list-scroll"
          >

            {/* My Satellites Section */}
            {filteredManagedSats.length > 0 && (
              <Box sx={{ marginBottom: "16px" }}>
                <Box sx={{ display: "flex", alignItems: "center", marginBottom: "8px", position: "sticky", top: 0, backgroundColor: "rgba(13, 13, 13, 0.95)", paddingY: "4px", zIndex: 1 }}>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: "#00ff41", 
                      fontWeight: "bold", 
                      letterSpacing: "1px",
                      textTransform: "uppercase",
                      fontFamily: "'Courier New', Courier, monospace"
                    }}
                  >
                    My Satellites
                  </Typography>
                  <Chip 
                    label={filteredManagedSats.length} 
                    size="small" 
                    sx={{ 
                      marginLeft: "8px", 
                      backgroundColor: "rgba(0, 255, 65, 0.2)", 
                      color: "#00ff41",
                      fontFamily: "'Courier New', Courier, monospace",
                      height: "20px"
                    }} 
                  />
                </Box>
                <Box sx={{ maxHeight: "200px", overflowY: "auto", paddingRight: "4px" }}>
                  <List sx={{ padding: 0 }}>
                    {filteredManagedSats.map((sat) => (
                      <ListItem key={sat._id} disablePadding>
                        <ListItemButton
                          onClick={() => {
                            dispatch(setSelectedSatId(sat._id));
                            setOpenPopover(false);
                          }}
                          sx={{
                            color: "#00ff41",
                            backgroundColor: selectedSatId === sat._id ? "rgba(0, 255, 65, 0.15)" : "transparent",
                            transition: "all 0.2s ease-in-out",
                            borderRadius: "6px",
                            marginBottom: "2px",
                            padding: "8px 12px",
                            "&:hover": {
                              backgroundColor: "rgba(0, 255, 65, 0.1)",
                              transform: "translateX(2px)"
                            }
                          }}
                        >
                          <ListItemText 
                            primary={sat.name}
                            sx={{
                              "& .MuiListItemText-primary": {
                                fontFamily: "'Courier New', Courier, monospace",
                                fontSize: "0.85rem",
                                fontWeight: selectedSatId === sat._id ? "bold" : "normal"
                              }
                            }}
                          />
                          <Chip 
                            label="MANAGED" 
                            size="small" 
                            sx={{ 
                              backgroundColor: "rgba(0, 255, 65, 0.3)", 
                              color: "#000",
                              fontFamily: "'Courier New', Courier, monospace",
                              fontSize: "0.6rem",
                              height: "18px",
                              fontWeight: "bold"
                            }} 
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </Box>
            )}

            {/* Divider between sections */}
            {filteredManagedSats.length > 0 && filteredDiscoverableSats.length > 0 && (
              <Box sx={{ display: "flex", alignItems: "center", margin: "16px 0", gap: "12px" }}>
                <Box sx={{ flex: 1, height: "1px", background: "linear-gradient(to right, transparent, rgba(0, 255, 65, 0.3), transparent)" }} />
                <Typography variant="caption" sx={{ color: "rgba(0, 255, 65, 0.6)", fontFamily: "'Courier New', Courier, monospace", fontSize: "0.7rem" }}>
                  DISCOVER
                </Typography>
                <Box sx={{ flex: 1, height: "1px", background: "linear-gradient(to left, transparent, rgba(0, 255, 65, 0.3), transparent)" }} />
              </Box>
            )}

            {/* Discover Satellites Section */}
            {filteredDiscoverableSats.length > 0 && (
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", marginBottom: "8px", position: "sticky", top: 0, backgroundColor: "rgba(13, 13, 13, 0.95)", paddingY: "4px", zIndex: 1 }}>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: "#00aaff", 
                      fontWeight: "bold", 
                      letterSpacing: "1px",
                      textTransform: "uppercase",
                      fontFamily: "'Courier New', Courier, monospace"
                    }}
                  >
                    Discover More
                  </Typography>
                  <Chip 
                    label={`${filteredDiscoverableSats.length}${filteredDiscoverableSats.length === 10 ? '+' : ''}`} 
                    size="small" 
                    sx={{ 
                      marginLeft: "8px", 
                      backgroundColor: "rgba(0, 170, 255, 0.2)", 
                      color: "#00aaff",
                      fontFamily: "'Courier New', Courier, monospace",
                      height: "20px"
                    }} 
                  />
                </Box>
                <Box sx={{ maxHeight: "200px", overflowY: "auto", paddingRight: "4px" }}>
                  <List sx={{ padding: 0 }}>
                    {filteredDiscoverableSats.map((sat) => (
                      <ListItem key={sat.id} disablePadding>
                        <ListItemButton
                          sx={{
                            color: "#cccccc",
                            transition: "all 0.2s ease-in-out",
                            borderRadius: "6px",
                            marginBottom: "2px",
                            padding: "8px 12px",
                            "&:hover": {
                              backgroundColor: "rgba(0, 170, 255, 0.1)",
                              transform: "translateX(2px)"
                            }
                          }}
                        >
                          <ListItemText 
                            primary={
                              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <Typography 
                                  sx={{
                                    fontFamily: "'Courier New', Courier, monospace",
                                    fontSize: "0.8rem",
                                    color: "#cccccc",
                                    maxWidth: "250px",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap"
                                  }}
                                >
                                  {sat.name}
                                </Typography>
                                <Box sx={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                                  {sat.country && (
                                    <Chip 
                                      label={sat.country} 
                                      size="small" 
                                      sx={{ 
                                        backgroundColor: "rgba(200, 200, 200, 0.15)", 
                                        color: "#aaa",
                                        fontFamily: "'Courier New', Courier, monospace",
                                        fontSize: "0.6rem",
                                        height: "16px",
                                        minWidth: "auto"
                                      }} 
                                    />
                                  )}
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleQuickAdd(sat);
                                    }}
                                    sx={{
                                      color: "#00aaff",
                                      padding: "4px",
                                      width: "24px",
                                      height: "24px",
                                      "&:hover": {
                                        backgroundColor: "rgba(0, 170, 255, 0.2)",
                                        transform: "scale(1.1)"
                                      }
                                    }}
                                  >
                                    <AddCircleOutlineIcon sx={{ fontSize: "16px" }} />
                                  </IconButton>
                                </Box>
                              </Box>
                            }
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </Box>
                {satelliteFilter && filteredDiscoverableSats.length === 10 && (
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: "#666", 
                      fontStyle: "italic",
                      textAlign: "center",
                      display: "block",
                      marginTop: "8px",
                      fontFamily: "'Courier New', Courier, monospace",
                      fontSize: "0.7rem"
                    }}
                  >
                    Showing first 10 results...
                  </Typography>
                )}
              </Box>
            )}

            {/* Loading state */}
            {loadingCelestrak && (
              <Box sx={{ textAlign: "center", padding: "20px" }}>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: "#ffaa00", 
                    fontFamily: "'Courier New', Courier, monospace",
                    fontSize: "0.8rem"
                  }}
                >
                  ⟳ Loading satellites...
                </Typography>
              </Box>
            )}

            {/* No results */}
            {satelliteFilter && filteredManagedSats.length === 0 && filteredDiscoverableSats.length === 0 && !loadingCelestrak && (
              <Box sx={{ textAlign: "center", padding: "20px" }}>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: "#666", 
                    fontFamily: "'Courier New', Courier, monospace",
                    fontSize: "0.8rem"
                  }}
                >
                  No satellites found for "{satelliteFilter}"
                </Typography>
              </Box>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SatellitePopover;