import React, { useState, useRef, useMemo } from "react";
import { IconButton, Tooltip, TextField, List, ListItem, ListItemButton, Box, Typography, Chip } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import RadarIcon from "@mui/icons-material/Radar";
import AddIcon from "@mui/icons-material/Add";
import LaunchIcon from "@mui/icons-material/Launch";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSatelliteDish } from "@fortawesome/free-solid-svg-icons";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../store";
import { setSelectedGroundStationId, setShowLineOfSight, setShowVisibilityCones, fetchMongoData } from "../store/mongoSlice";
import { getDisplayGroundStations, type DisplayGroundStation } from "../utils/groundStationDataUtils";
import { useTheme } from "../contexts/ThemeContext";

const GroundStationPopover: React.FC = () => {

  const dispatch = useDispatch<AppDispatch>();
  const { theme } = useTheme();
  const [openPopover, setOpenPopover] = useState<boolean>(false);
  const [groundStationFilter, setGroundStationFilter] = useState<string>("");
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const {groundStations, selectedGroundStationId } = useSelector((state: RootState) => state.mongo);
  const showLineOfSight = useSelector((state: RootState) => state.mongo.showLineOfSight);
  const showVisibilityCones = useSelector((state: RootState) => state.mongo.showVisibilityCones);

  // Popout handler
  const handleGroundStationsPopOut = () => {
    window.open('/gs', '_blank', 'width=1200,height=800');
  };

  // Get merged ground station data (API + predefined)
  const displayGroundStations = useMemo(() => {
    return getDisplayGroundStations(groundStations);
  }, [groundStations]);

  // Separate managed and discoverable ground stations first
  const managedGS = useMemo(() => 
    displayGroundStations.filter((gs: DisplayGroundStation) => gs.source === "api" || gs.source === "custom"), 
    [displayGroundStations]
  );
  
  const discoverableGS = useMemo(() => 
    displayGroundStations.filter((gs: DisplayGroundStation) => gs.source === "predefined"), 
    [displayGroundStations]
  );

  // Filter managed ground stations (always visible, no search filtering)
  const filteredManagedGS = managedGS;
  
  // Filter discoverable ground stations (only apply search to discover section)
  const filteredDiscoverableGS = useMemo(() => {
    if (!groundStationFilter) return discoverableGS;
    
    const lowerFilter = groundStationFilter.toLowerCase();
    return discoverableGS.filter((gs: DisplayGroundStation) =>
      gs.name.toLowerCase().includes(lowerFilter) ||
      gs.country.toLowerCase().includes(lowerFilter) ||
      gs.city?.toLowerCase().includes(lowerFilter) ||
      gs.operator?.toLowerCase().includes(lowerFilter)
    );
  }, [discoverableGS, groundStationFilter]);

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

  // Country flag component (matching SatellitePopover)
  const CountryFlag: React.FC<{ country: string; size?: number }> = ({ country, size = 20 }) => {
    const countryCodeMap: { [key: string]: string } = {
      "USA": "US",
      "United States": "US",
      "Russia": "RU",
      "Germany": "DE", 
      "France": "FR",
      "Spain": "ES",
      "Australia": "AU",
      "Japan": "JP",
      "China": "CN",
      "Kazakhstan": "KZ",
      "India": "IN",
      "United Kingdom": "GB",
      "Canada": "CA",
      "Brazil": "BR",
      "Italy": "IT",
      "South Korea": "KR",
      "Israel": "IL",
      "Norway": "NO",
    };

    if (!country || country === "Unknown") {
      return <span style={{ color: theme.textSecondary, fontSize: `${size}px` }}>📡</span>;
    }
    
    const countryCode = countryCodeMap[country] || country.slice(0, 2).toUpperCase();
    const flagUrl = `https://flagcdn.com/24x18/${countryCode.toLowerCase()}.png`;
    
    return (
      <img 
        src={flagUrl} 
        alt={`${country} flag`}
        style={{ 
          width: `${size}px`, 
          height: `${Math.round(size * 0.75)}px`, 
          objectFit: "cover",
          borderRadius: "2px"
        }}
        onError={(e) => {
          // Fallback to generic flag if country flag not found
          e.currentTarget.src = "https://flagcdn.com/24x18/un.png";
        }}
      />
    );
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
            position: "fixed", // Changed from absolute to fixed for better positioning
            top: "80px", // Position it underneath GlobeTools (which is at ~20px + 48px height)
            left: "20px", // Left-align with GlobeTools
            backgroundColor: 'rgba(10, 15, 25, 0.9)', // Match GlobeTools background
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: `1px solid rgba(${theme.primaryRGB}, 0.3)`,
            borderRadius: "16px", // Match GlobeTools border radius
            boxShadow: `0 16px 50px rgba(${theme.primaryRGB}, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 40px rgba(${theme.primaryRGB}, 0.15)`, // Match GlobeTools shadow
            color: theme.textPrimary,
            fontFamily: "Courier New, Courier, monospace",
            padding: "16px", // Increased padding
            width: "500px", // Made wider to match SatellitePopover
            maxHeight: "75vh", // Increased max height to match SatellitePopover
            zIndex: 999, // Slightly lower than GlobeTools
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)', // Match GlobeTools transition
          }}
          onMouseDown={(e) => e.stopPropagation()} // Prevent event bubbling
          onClick={(e) => e.stopPropagation()} // Prevent event bubbling
        >
          {/* Header Section */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '12px',
            paddingBottom: '8px',
            borderBottom: `1px solid rgba(${theme.primaryRGB}, 0.2)`
          }}>
            <Typography 
              variant="h6" 
              sx={{ 
                color: theme.primary, 
                fontWeight: "bold", 
                fontFamily: "'Courier New', Courier, monospace",
                fontSize: '1rem'
              }}
            >
              📡 Ground Stations
            </Typography>
            <Tooltip title="Open Full Ground Stations Database" arrow>
              <IconButton
                onClick={handleGroundStationsPopOut}
                sx={{ 
                  color: theme.textSecondary,
                  '&:hover': { color: theme.primary },
                  padding: '4px'
                }}
                size="small"
              >
                <LaunchIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Fixed Header Section with Control Buttons */}
          <div style={{ flexShrink: 0 }}>
            {/* Control Buttons */}
            <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginBottom: "12px" }}>
              {/* Toggle Line of Sight */}
              <Tooltip title="Toggle Line of Sight" arrow placement="bottom">
                <IconButton
                  onClick={() => dispatch(setShowLineOfSight(!showLineOfSight))}
                  className={`icon-button ${showLineOfSight ? 'active' : ''}`}
                >
                  <VisibilityIcon />
                </IconButton>
              </Tooltip>

              {/* Toggle Visibility Cones */}
              <Tooltip title="Toggle Visibility Cones" arrow placement="bottom">
                <IconButton
                  onClick={() => dispatch(setShowVisibilityCones(!showVisibilityCones))}
                  className={`icon-button ${showVisibilityCones ? 'active' : ''}`}
                >
                  <RadarIcon />
                </IconButton>
              </Tooltip>
            </div>
          </div>

          {/* Scrollable Content Area */}
          <div 
            style={{ 
              flex: 1,
              overflowY: "hidden",
              overflowX: "hidden",
              paddingRight: "0px",
            }}
            className="ground-station-popover-content"
          >

            {/* My Ground Stations Section - Simple Pinned List */}
            {filteredManagedGS.length > 0 && (
              <Box sx={{ marginBottom: "16px" }}>
                <Box sx={{ 
                  display: "flex", 
                  alignItems: "center", 
                  marginBottom: "8px", 
                  position: "sticky", 
                  top: 0, 
                  backgroundColor: 'rgba(10, 15, 25, 0.95)', 
                  paddingY: "6px", 
                  zIndex: 1, 
                  borderRadius: "6px",
                  borderBottom: `1px solid rgba(${theme.primaryRGB}, 0.2)`
                }}>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: theme.primary, 
                      fontWeight: "bold", 
                      letterSpacing: "1px",
                      textTransform: "uppercase",
                      fontFamily: "'Courier New', Courier, monospace",
                      fontSize: "0.8rem"
                    }}
                  >
                    📌 My Ground Stations
                  </Typography>
                  <Chip 
                    label={filteredManagedGS.length} 
                    size="small" 
                    sx={{ 
                      marginLeft: "8px", 
                      backgroundColor: `rgba(${theme.primaryRGB}, 0.2)`, 
                      color: theme.primary,
                      fontFamily: "'Courier New', Courier, monospace",
                      height: "18px",
                      fontSize: "0.65rem"
                    }} 
                  />
                </Box>
                <Box sx={{ 
                  maxHeight: "150px", 
                  overflowY: "auto", 
                  paddingRight: "4px",
                  // Custom scrollbar styling
                  '&::-webkit-scrollbar': {
                    width: '6px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: `rgba(${theme.primaryRGB}, 0.1)`,
                    borderRadius: '3px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: `rgba(${theme.primaryRGB}, 0.4)`,
                    borderRadius: '3px',
                    '&:hover': {
                      background: `rgba(${theme.primaryRGB}, 0.6)`,
                    }
                  },
                  // Firefox scrollbar
                  scrollbarWidth: 'thin',
                  scrollbarColor: `rgba(${theme.primaryRGB}, 0.4) rgba(${theme.primaryRGB}, 0.1)`,
                }}>
                  <List sx={{ padding: 0 }}>
                    {filteredManagedGS.map((gs: DisplayGroundStation) => (
                      <ListItem key={gs.id} disablePadding>
                        <ListItemButton
                          onClick={() => {
                            dispatch(setSelectedGroundStationId(gs.id));
                            setOpenPopover(false);
                          }}
                          sx={{
                            color: theme.primary,
                            backgroundColor: selectedGroundStationId === gs.id ? `rgba(${theme.primaryRGB}, 0.15)` : "transparent",
                            transition: "all 0.2s ease-in-out",
                            borderRadius: "6px",
                            marginBottom: "2px",
                            padding: "6px 8px",
                            "&:hover": {
                              backgroundColor: `rgba(${theme.primaryRGB}, 0.1)`,
                              transform: "translateX(2px)"
                            }
                          }}
                        >
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1 }}>
                            <CountryFlag country={gs.country} size={16} />
                            <Box sx={{ flex: 1 }}>
                              <Typography 
                                sx={{
                                  fontFamily: "'Courier New', Courier, monospace",
                                  fontSize: "0.8rem",
                                  fontWeight: selectedGroundStationId === gs.id ? "bold" : "normal",
                                  color: selectedGroundStationId === gs.id ? theme.primary : theme.textPrimary,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap"
                                }}
                              >
                                {gs.name}
                              </Typography>
                              <Typography 
                                sx={{
                                  fontFamily: "'Courier New', Courier, monospace",
                                  fontSize: "0.65rem",
                                  color: `rgba(${theme.primaryRGB}, 0.6)`,
                                  marginTop: "1px"
                                }}
                              >
                                {gs.city}, {gs.country}
                              </Typography>
                            </Box>
                          </Box>
                          <Chip 
                            label="PINNED" 
                            size="small" 
                            sx={{ 
                              backgroundColor: `rgba(${theme.primaryRGB}, 0.25)`, 
                              color: theme.primary,
                              fontFamily: "'Courier New', Courier, monospace",
                              fontSize: "0.55rem",
                              height: "16px",
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

            {/* Discover Ground Stations Section with integrated search */}
            <Box>
              <Box sx={{ 
                display: "flex", 
                alignItems: "center", 
                marginBottom: "12px", 
                position: "sticky", 
                top: 0, 
                backgroundColor: 'rgba(10, 15, 25, 0.95)', 
                paddingY: "8px", 
                zIndex: 1, 
                borderRadius: "6px",
                borderBottom: `1px solid rgba(${theme.secondaryRGB}, 0.2)`
              }}>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: theme.secondary, 
                    fontWeight: "bold", 
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                    fontFamily: "'Courier New', Courier, monospace",
                    fontSize: "0.8rem"
                  }}
                >
                  🔍 Discover More ({discoverableGS.length})
                </Typography>
                <Chip 
                  label={filteredDiscoverableGS.length} 
                  size="small" 
                  sx={{ 
                    marginLeft: "8px", 
                    backgroundColor: `rgba(${theme.secondaryRGB}, 0.2)`, 
                    color: theme.secondary,
                    fontFamily: "'Courier New', Courier, monospace",
                    height: "18px",
                    fontSize: "0.65rem"
                  }} 
                />
              </Box>

              {/* Search Field for Discovery */}
              <TextField
                fullWidth
                placeholder="Search ground station database..."
                value={groundStationFilter}
                onChange={(e) => setGroundStationFilter(e.target.value)}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                onFocus={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                sx={{
                  marginBottom: "12px",
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: `rgba(${theme.secondaryRGB}, 0.05)`,
                    color: theme.secondary,
                    fontFamily: "'Courier New', Courier, monospace",
                    fontSize: "0.85rem",
                    "& fieldset": {
                      borderColor: `rgba(${theme.secondaryRGB}, 0.3)`,
                    },
                    "&:hover fieldset": {
                      borderColor: `rgba(${theme.secondaryRGB}, 0.5)`,
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: theme.secondary,
                      boxShadow: `0 0 8px rgba(${theme.secondaryRGB}, 0.3)`,
                    },
                  },
                  "& .MuiInputBase-input": {
                    "&::placeholder": {
                      color: `rgba(${theme.secondaryRGB}, 0.6)`,
                      opacity: 1,
                    },
                    "&:focus": {
                      outline: "none",
                    }
                  },
                }}
              />

              {/* Ground Station List */}
              {filteredDiscoverableGS.length > 0 ? (
                <Box sx={{ 
                  maxHeight: "300px", 
                  overflowY: "auto", 
                  paddingRight: "4px",
                  // Custom scrollbar styling
                  '&::-webkit-scrollbar': {
                    width: '6px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: `rgba(${theme.secondaryRGB}, 0.1)`,
                    borderRadius: '3px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: `rgba(${theme.secondaryRGB}, 0.4)`,
                    borderRadius: '3px',
                    '&:hover': {
                      background: `rgba(${theme.secondaryRGB}, 0.6)`,
                    }
                  },
                  // Firefox scrollbar
                  scrollbarWidth: 'thin',
                  scrollbarColor: `rgba(${theme.secondaryRGB}, 0.4) rgba(${theme.secondaryRGB}, 0.1)`,
                }}>
                  <List sx={{ padding: 0 }}>
                    {filteredDiscoverableGS.map((gs: DisplayGroundStation) => (
                      <ListItem key={gs.id} disablePadding>
                        <Tooltip title="Click to add and select this ground station" arrow placement="left">
                          <ListItemButton
                            onClick={async () => {
                              // Quick-add the ground station first, then select it
                              try {
                                console.log("Adding ground station:", gs.name);
                                await handleQuickAdd(gs);
                              } catch (error) {
                                console.error('Failed to add ground station:', error);
                              }
                            }}
                            sx={{
                              color: "#cccccc",
                              transition: "all 0.2s ease-in-out",
                              borderRadius: "6px",
                              marginBottom: "2px",
                              padding: "6px 8px",
                              cursor: "pointer",
                              "&:hover": {
                                backgroundColor: `rgba(${theme.secondaryRGB}, 0.15)`,
                                transform: "translateX(2px)",
                                "& .ground-station-name": {
                                  color: theme.secondary
                                }
                              }
                            }}
                          >
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1 }}>
                              <CountryFlag country={gs.country || 'Unknown'} size={16} />
                              <Box sx={{ flex: 1 }}>
                                <Typography 
                                  className="ground-station-name"
                                  sx={{
                                    fontFamily: "'Courier New', Courier, monospace",
                                    fontSize: "0.75rem",
                                    color: "#cccccc",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    transition: "color 0.2s ease"
                                  }}
                                >
                                  {gs.name}
                                </Typography>
                                <Typography 
                                  sx={{
                                    fontFamily: "'Courier New', Courier, monospace",
                                    fontSize: "0.6rem",
                                    color: "#888",
                                    marginTop: "1px"
                                  }}
                                >
                                  {gs.city}, {gs.country} • {gs.operator}
                                </Typography>
                              </Box>
                            </Box>
                            <Chip 
                              label="ADD" 
                              size="small" 
                              sx={{ 
                                backgroundColor: `rgba(${theme.secondaryRGB}, 0.25)`, 
                                color: theme.secondary,
                                fontFamily: "'Courier New', Courier, monospace",
                                fontSize: "0.55rem",
                                height: "16px",
                                fontWeight: "bold"
                              }} 
                            />
                          </ListItemButton>
                        </Tooltip>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              ) : (
                <Box sx={{ 
                  textAlign: "center", 
                  padding: "20px", 
                  color: `rgba(${theme.secondaryRGB}, 0.6)` 
                }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontFamily: "'Courier New', Courier, monospace",
                      fontSize: "0.75rem"
                    }}
                  >
                    {groundStationFilter 
                      ? `No ground stations found for "${groundStationFilter}"`
                      : 'Start typing to search ground stations...'
                    }
                  </Typography>
                </Box>
              )}
            </Box>

          </div>
        </div>
      )}
    </div>
  );
};

export default GroundStationPopover;