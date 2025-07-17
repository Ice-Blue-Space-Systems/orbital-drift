import React, { useState, useRef, useMemo } from "react";
import { IconButton, Tooltip, TextField, List, ListItem, ListItemButton, ListItemText, Box, Typography, Chip } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import RadarIcon from "@mui/icons-material/Radar";
import AddIcon from "@mui/icons-material/Add";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSatelliteDish } from "@fortawesome/free-solid-svg-icons";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../store";
import { setSelectedGroundStationId, setShowLineOfSight, setShowVisibilityCones, fetchMongoData } from "../store/mongoSlice";
import { getDisplayGroundStations, type DisplayGroundStation } from "../utils/groundStationDataUtils";
import { useTheme } from "../contexts/ThemeContext";

const GroundStationPopover: React.FC = () => {

  const dispatch = useDispatch<AppDispatch>();
  const [openPopover, setOpenPopover] = useState<boolean>(false);
  const [groundStationFilter, setGroundStationFilter] = useState<string>("");
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const {groundStations, selectedGroundStationId } = useSelector((state: RootState) => state.mongo);
  const showLineOfSight = useSelector((state: RootState) => state.mongo.showLineOfSight);
  const showVisibilityCones = useSelector((state: RootState) => state.mongo.showVisibilityCones);

  // Get merged ground station data (API + predefined)
  const displayGroundStations = useMemo(() => {
    return getDisplayGroundStations(groundStations);
  }, [groundStations]);

  // Filter ground stations based on search
  const filteredGroundStations = useMemo(() => {
    if (!groundStationFilter) return displayGroundStations;
    
    const lowerFilter = groundStationFilter.toLowerCase();
    return displayGroundStations.filter((gs: DisplayGroundStation) =>
      gs.name.toLowerCase().includes(lowerFilter) ||
      gs.country.toLowerCase().includes(lowerFilter) ||
      gs.city?.toLowerCase().includes(lowerFilter) ||
      gs.operator?.toLowerCase().includes(lowerFilter)
    );
  }, [displayGroundStations, groundStationFilter]);

  // Separate managed and discoverable ground stations
  const filteredManagedGS = useMemo(() => 
    filteredGroundStations.filter((gs: DisplayGroundStation) => gs.source === "api" || gs.source === "custom"), 
    [filteredGroundStations]
  );
  
  const filteredDiscoverableGS = useMemo(() => 
    filteredGroundStations.filter((gs: DisplayGroundStation) => gs.source === "predefined"), 
    [filteredGroundStations]
  );

  // Quick-add ground station
  const handleQuickAdd = async (groundStation: DisplayGroundStation) => {
    try {
      const response = await fetch('/api/ground-stations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: groundStation.name,
          country: groundStation.country,
          city: groundStation.city,
          latitude: groundStation.latitude,
          longitude: groundStation.longitude,
          altitude: groundStation.altitude,
          status: groundStation.status,
          frequency: groundStation.frequency,
          bandType: groundStation.bandType,
          elevation: groundStation.elevation,
          azimuth: groundStation.azimuth,
          operator: groundStation.operator,
          established: groundStation.established,
          description: groundStation.description,
        }),
      });

      if (response.ok) {
        const newGroundStation = await response.json();
        console.log('Ground station added successfully:', newGroundStation);
        // Refresh data from API
        dispatch(fetchMongoData());
        // Select the new ground station
        dispatch(setSelectedGroundStationId(newGroundStation._id));
        setOpenPopover(false);
      } else {
        console.error('Failed to add ground station:', response.statusText);
      }
    } catch (error) {
      console.error('Error adding ground station:', error);
    }
  };

  const getCountryFlagSafe = (countryCode: string): string => {
    try {
      // Map country names to ISO codes for flag display
      const countryMap: { [key: string]: string } = {
        'USA': 'US',
        'United States': 'US', 
        'Russia': 'RU',
        'Germany': 'DE',
        'France': 'FR',
        'Spain': 'ES',
        'Australia': 'AU',
        'Japan': 'JP',
        'China': 'CN',
        'Kazakhstan': 'KZ',
        'India': 'IN',
        'United Kingdom': 'GB',
        'Canada': 'CA',
        'Brazil': 'BR',
        'Italy': 'IT',
        'South Korea': 'KR',
        'Israel': 'IL',
        'Norway': 'NO',
      };
      
      const code = countryMap[countryCode] || countryCode;
      // Simple flag emoji based on country
      const flagMap: { [key: string]: string } = {
        'US': '🇺🇸', 'RU': '🇷🇺', 'DE': '🇩🇪', 'FR': '🇫🇷', 'ES': '🇪🇸',
        'AU': '🇦🇺', 'JP': '🇯🇵', 'CN': '🇨🇳', 'KZ': '🇰🇿', 'IN': '🇮🇳',
        'GB': '🇬🇧', 'CA': '🇨🇦', 'BR': '🇧🇷', 'IT': '🇮🇹', 'KR': '🇰🇷',
        'IL': '🇮🇱', 'NO': '🇳🇴'
      };
      return flagMap[code] || '🌍';
    } catch {
      return '🌍';
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
            top: "46px",
            left: "0",
            backgroundColor: "rgba(13, 13, 13, 0.95)",
            border: "1px solid rgba(0, 255, 65, 0.4)",
            color: "#00ff00",
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
            {/* Line of Sight and Visibility Cones Toggles */}
            <div className="globe-tools-group" style={{ marginBottom: "12px" }}>
              <Tooltip title="Toggle Line of Sight" arrow placement="bottom">
                <IconButton
                  onClick={() => dispatch(setShowLineOfSight(!showLineOfSight))}
                  className={`icon-button ${showLineOfSight ? 'active' : ''}`}
                >
                  <VisibilityIcon />
                </IconButton>
              </Tooltip>

              <Tooltip title="Toggle Visibility Cones" arrow placement="bottom">
                <IconButton
                  onClick={() => dispatch(setShowVisibilityCones(!showVisibilityCones))}
                  className={`icon-button ${showVisibilityCones ? 'active' : ''}`}
                >
                  <RadarIcon />
                </IconButton>
              </Tooltip>
            </div>

            {/* Search Field */}
            <TextField
              fullWidth
              placeholder="Search Ground Stations..."
              value={groundStationFilter}
              onChange={(e) => setGroundStationFilter(e.target.value)}
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

            {/* My Ground Stations Section */}
            {filteredManagedGS.length > 0 && (
              <Box sx={{ marginBottom: "16px" }}>
                <Box sx={{ display: "flex", alignItems: "center", marginBottom: "8px", position: "sticky", top: 0, backgroundColor: "rgba(13, 13, 13, 0.95)", paddingY: "4px", zIndex: 1 }}>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: "#00ff41", 
                      fontWeight: "bold", 
                      letterSpacing: "1px",
                      textTransform: "uppercase",
                      fontFamily: "'Courier New', Courier, monospace",
                      fontSize: "0.75rem",
                    }}
                  >
                    🏛️ My Ground Stations ({filteredManagedGS.length})
                  </Typography>
                </Box>
                
                {filteredManagedGS.map((gs: DisplayGroundStation) => (
                  <ListItem key={gs.id} disablePadding sx={{ marginBottom: "4px" }}>
                    <ListItemButton
                      onClick={() => {
                        console.log("Ground Station ID:", gs);
                        dispatch(setSelectedGroundStationId(gs.id));
                        setOpenPopover(false);
                      }}
                      sx={{
                        color: "#00ff41",
                        backgroundColor: "rgba(20, 20, 20, 0.6)",
                        border: "1px solid rgba(0, 255, 65, 0.2)",
                        borderRadius: "6px",
                        padding: "8px 12px",
                        transition: "all 0.2s ease-in-out",
                        "&:hover": {
                          backgroundColor: "rgba(0, 255, 65, 0.1)",
                          borderColor: "rgba(0, 255, 65, 0.4)",
                          transform: "translateX(2px)",
                        },
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
                        <Box sx={{ marginRight: "8px", fontSize: "1.2rem" }}>
                          {getCountryFlagSafe(gs.country)}
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: "#00ff41", 
                              fontWeight: "bold",
                              fontFamily: "'Courier New', Courier, monospace",
                              fontSize: "0.85rem",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {gs.name}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: "rgba(0, 255, 65, 0.7)", 
                              fontFamily: "'Courier New', Courier, monospace",
                              fontSize: "0.7rem",
                              display: "block",
                            }}
                          >
                            {gs.city}, {gs.country} • {gs.operator}
                          </Typography>
                        </Box>
                        {gs.source === "api" && (
                          <Chip 
                            label="MANAGED" 
                            size="small" 
                            sx={{ 
                              backgroundColor: "rgba(0, 255, 65, 0.2)",
                              color: "#00ff41",
                              fontSize: "0.6rem",
                              fontFamily: "'Courier New', Courier, monospace",
                              fontWeight: "bold",
                              height: "20px",
                            }}
                          />
                        )}
                      </Box>
                    </ListItemButton>
                  </ListItem>
                ))}
              </Box>
            )}

            {/* Discoverable Ground Stations Section */}
            {filteredDiscoverableGS.length > 0 && (
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", marginBottom: "8px", position: "sticky", top: 0, backgroundColor: "rgba(13, 13, 13, 0.95)", paddingY: "4px", zIndex: 1 }}>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: "rgba(0, 255, 65, 0.8)", 
                      fontWeight: "bold", 
                      letterSpacing: "1px",
                      textTransform: "uppercase",
                      fontFamily: "'Courier New', Courier, monospace",
                      fontSize: "0.75rem",
                    }}
                  >
                    🌍 Discover Ground Stations ({filteredDiscoverableGS.length})
                  </Typography>
                </Box>
                
                {filteredDiscoverableGS.map((gs: DisplayGroundStation) => (
                  <ListItem key={gs.id} disablePadding sx={{ marginBottom: "4px" }}>
                    <ListItemButton
                      onClick={() => {
                        console.log("Discoverable Ground Station:", gs);
                        // For predefined stations, we can either select them directly or show details
                        // For now, let's allow quick selection
                        dispatch(setSelectedGroundStationId(gs.id));
                        setOpenPopover(false);
                      }}
                      sx={{
                        color: "rgba(0, 255, 65, 0.8)",
                        backgroundColor: "rgba(15, 15, 15, 0.4)",
                        border: "1px solid rgba(0, 255, 65, 0.15)",
                        borderRadius: "6px",
                        padding: "8px 12px",
                        transition: "all 0.2s ease-in-out",
                        "&:hover": {
                          backgroundColor: "rgba(0, 255, 65, 0.08)",
                          borderColor: "rgba(0, 255, 65, 0.3)",
                          color: "#00ff41",
                        },
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
                        <Box sx={{ marginRight: "8px", fontSize: "1.2rem" }}>
                          {getCountryFlagSafe(gs.country)}
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontWeight: "bold",
                              fontFamily: "'Courier New', Courier, monospace",
                              fontSize: "0.85rem",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {gs.name}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: "rgba(0, 255, 65, 0.6)", 
                              fontFamily: "'Courier New', Courier, monospace",
                              fontSize: "0.7rem",
                              display: "block",
                            }}
                          >
                            {gs.city}, {gs.country} • {gs.operator}
                          </Typography>
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <Chip 
                            label="MAJOR"
                            size="small" 
                            sx={{ 
                              backgroundColor: "rgba(0, 255, 65, 0.1)",
                              color: "rgba(0, 255, 65, 0.8)",
                              fontSize: "0.6rem",
                              fontFamily: "'Courier New', Courier, monospace",
                              fontWeight: "bold",
                              height: "18px",
                            }}
                          />
                          <Tooltip title="Quick Add to My Ground Stations" arrow>
                            <IconButton
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuickAdd(gs);
                              }}
                              sx={{
                                color: "rgba(0, 255, 65, 0.6)",
                                padding: "2px",
                                fontSize: "0.8rem",
                                "&:hover": {
                                  color: "#00ff41",
                                  backgroundColor: "rgba(0, 255, 65, 0.1)",
                                },
                              }}
                            >
                              <AddIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    </ListItemButton>
                  </ListItem>
                ))}
              </Box>
            )}

            {/* No Results Message */}
            {filteredGroundStations.length === 0 && groundStationFilter && (
              <Box sx={{ textAlign: "center", padding: "20px", color: "rgba(0, 255, 65, 0.6)" }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontFamily: "'Courier New', Courier, monospace",
                    fontSize: "0.9rem"
                  }}
                >
                  No ground stations found for "{groundStationFilter}"
                </Typography>
              </Box>
            )}

          </div>
        </div>
      )}
    </div>
  );
};

export default GroundStationPopover;