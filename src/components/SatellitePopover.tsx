import React, { useState, useRef, useEffect } from "react";
import { IconButton, Tooltip, TextField, List, ListItem, ListItemButton, ListItemText, Typography, Chip, Box } from "@mui/material";
import SatelliteIcon from "@mui/icons-material/SatelliteAlt";
import HistoryIcon from "@mui/icons-material/History";
import PublicIcon from "@mui/icons-material/Public";
import MyLocationIcon from "@mui/icons-material/MyLocation"; // For nadir lines - represents targeting/location
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import LaunchIcon from "@mui/icons-material/Launch";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../store";
import { setSelectedSatId, setShowHistory, setShowTle, setShowGroundTrack, setShowNadirLines, addSatellite } from "../store/mongoSlice";
import { fetchCelesTrakSatellites, DisplaySatellite, getSatelliteStats } from "../utils/satelliteDataUtils";
import { useTheme } from "../contexts/ThemeContext";

const SatellitePopover: React.FC = () => {
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const [openPopover, setOpenPopover] = useState<boolean>(false);
  const [satelliteFilter, setSatelliteFilter] = useState<string>("");
  const [celestrakSatellites, setCelestrakSatellites] = useState<DisplaySatellite[]>([]);
  const [loadingCelestrak, setLoadingCelestrak] = useState<boolean>(false);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { satellites, selectedSatId } = useSelector((state: RootState) => state.mongo);
  const showHistoryState = useSelector((state: RootState) => state.mongo.showHistory);
  const showTleState = useSelector((state: RootState) => state.mongo.showTle);
  const showGroundTrackState = useSelector((state: RootState) => state.mongo.showGroundTrack);
  const showNadirLinesState = useSelector((state: RootState) => state.mongo.showNadirLines);

  // Country detection from satellite name (same logic as satelliteDataUtils)
  const getCountryFromSatelliteName = (name: string): string => {
    const nameUpper = name.toUpperCase();
    
    // SpaceX and US Commercial
    if (nameUpper.includes("STARLINK") || nameUpper.includes("FALCON") || nameUpper.includes("DRAGON")) return "USA";
    
    // Russian satellites
    if (nameUpper.includes("COSMOS") || nameUpper.includes("SOYUZ") || nameUpper.includes("PROGRESS")) return "Russia";
    if (nameUpper.includes("MOLNIYA") || nameUpper.includes("GLONAS")) return "Russia";
    
    // Chinese satellites
    if (nameUpper.includes("TIANGONG") || nameUpper.includes("SHENZHOU") || nameUpper.includes("CHANG'E")) return "China";
    if (nameUpper.includes("FENGYUN") || nameUpper.includes("YAOGAN")) return "China";
    
    // European satellites
    if (nameUpper.includes("SENTINEL") || nameUpper.includes("GALILEO") || nameUpper.includes("ENVISAT")) return "Europe";
    if (nameUpper.includes("ERS") || nameUpper.includes("METEOSAT")) return "Europe";
    
    // US Commercial and Government
    if (nameUpper.includes("IRIDIUM") || nameUpper.includes("GLOBALSTAR") || nameUpper.includes("ONEWEB")) return "USA";
    if (nameUpper.includes("TERRA") || nameUpper.includes("AQUA") || nameUpper.includes("LANDSAT")) return "USA";
    if (nameUpper.includes("GPS") || nameUpper.includes("NAVSTAR")) return "USA";
    if (nameUpper.includes("GOES") || nameUpper.includes("NOAA")) return "USA";
    
    // Japanese satellites
    if (nameUpper.includes("ALOS") || nameUpper.includes("HIMAWARI") || nameUpper.includes("JCSAT")) return "Japan";
    
    // Indian satellites
    if (nameUpper.includes("RESOURCESAT") || nameUpper.includes("CARTOSAT") || nameUpper.includes("INSAT")) return "India";
    
    // Canadian satellites
    if (nameUpper.includes("RADARSAT") || nameUpper.includes("ANIK")) return "Canada";
    
    // ISS and international missions
    if (nameUpper.includes("ISS") || nameUpper.includes("INTERNATIONAL SPACE STATION")) return "International";
    
    return "International";
  };
  const countryCodeMap: Record<string, string> = {
    "USA": "US",
    "United States": "US", 
    "Russia": "RU",
    "China": "CN",
    "Japan": "JP",
    "India": "IN",
    "France": "FR",
    "Germany": "DE",
    "United Kingdom": "GB",
    "Canada": "CA",
    "Italy": "IT",
    "Spain": "ES",
    "Australia": "AU",
    "Brazil": "BR",
    "South Korea": "KR",
    "International": "UN", // Use UN flag for international
    "Europe": "EU",
    "ESA": "EU", // European Space Agency
    "NASA": "US",
    "ROSCOSMOS": "RU",
    "CNSA": "CN",
    "JAXA": "JP",
    "ISRO": "IN",
    "Kazakhstan": "KZ",
    "Israel": "IL",
    "Norway": "NO",
    "Netherlands": "NL",
    "Sweden": "SE",
    "Finland": "FI",
    "Denmark": "DK",
    "Belgium": "BE",
    "Switzerland": "CH",
    "Poland": "PL",
    "Argentina": "AR",
    "Mexico": "MX",
    "Chile": "CL",
    "Iran": "IR",
    "Turkey": "TR",
    "South Africa": "ZA",
    "Ukraine": "UA",
    "Indonesia": "ID",
    "Thailand": "TH",
    "Malaysia": "MY",
    "Singapore": "SG",
    "New Zealand": "NZ",
    "Egypt": "EG",
    "UAE": "AE",
    "Saudi Arabia": "SA",
  };

  // Country flag component (same as SatsPage)
  const CountryFlag: React.FC<{ country: string; size?: number }> = ({ country, size = 20 }) => {
    if (!country || country === "Unknown") {
      return <span style={{ color: theme.textSecondary, fontSize: `${size}px` }}>🛰️</span>;
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

  // Popout handler
  const handleSatsPopOut = () => {
    window.open('/sats', '_blank', 'width=1200,height=800');
  };

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

  // Filter managed satellites (MongoDB) - simple name filter only
  const filteredManagedSats = satellites.filter((sat) =>
    sat.name.toLowerCase().includes(satelliteFilter.toLowerCase())
  );

  // Apply filters to celestrak satellites
  const applyFilters = (sats: DisplaySatellite[]) => {
    return sats.filter(sat => {
      // Apply search filter
      if (satelliteFilter && !sat.name.toLowerCase().includes(satelliteFilter.toLowerCase())) {
        return false;
      }
      
      // Apply orbit type filters
      if (activeFilters.size > 0) {
        return activeFilters.has(sat.orbitType || 'Unknown');
      }
      
      return true;
    });
  };

  // Filter discoverable satellites (CelesTrak) - exclude ones already in MongoDB and apply filters
  const managedSatNames = new Set(satellites.map(sat => sat.name.toLowerCase()));
  const filteredDiscoverableSats = applyFilters(celestrakSatellites)
    .filter((sat) => !managedSatNames.has(sat.name.toLowerCase()))
    .slice(0, 20); // Limit to first 20 results for better discovery

  // Toggle filter function
  const toggleFilter = (filterKey: string) => {
    setActiveFilters(prev => {
      const newFilters = new Set(prev);
      if (newFilters.has(filterKey)) {
        newFilters.delete(filterKey);
      } else {
        newFilters.add(filterKey);
      }
      return newFilters;
    });
  };

  // Get stats for celestrak satellites
  const discoverStats = getSatelliteStats(celestrakSatellites);

  const handleQuickAdd = async (satellite: DisplaySatellite) => {
    try {
      const requestBody: any = {
        name: satellite.name,
        noradId: satellite.noradId,
        type: 'live', // CelesTrak satellites are live
        description: `Added from CelesTrak - ${satellite.description || 'Satellite from CelesTrak database'}`
      };

      // If we have the original CelesTrak data, include TLE data
      if (satellite.celestrakData) {
        requestBody.tleData = satellite.celestrakData;
      }

      // POST new satellite to API
      const response = await fetch('/api/satellites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const addedSatellite = await response.json();
        // Add the satellite to Redux state immediately
        dispatch(addSatellite(addedSatellite));
      } else {
        const errorData = await response.text();
        console.error('Failed to add satellite:', response.status, response.statusText, errorData);
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
            width: "500px", // Made wider
            maxHeight: "75vh", // Increased max height
            zIndex: 999, // Slightly lower than GlobeTools
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)', // Match GlobeTools transition
          }}
          onMouseDown={(e) => e.stopPropagation()} // Prevent event bubbling
          onClick={(e) => e.stopPropagation()} // Prevent event bubbling
        >
          {/* Header with title and popout button */}
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
              🛰️ Satellites
            </Typography>
            <Tooltip title="Open Full Satellites Database" arrow>
              <IconButton
                onClick={handleSatsPopOut}
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

          {/* Fixed Header Section */}
          <div style={{ flexShrink: 0 }}>
            {/* Show TLE, History, and Ground Track Toggles */}
            <div className="globe-tools-group" style={{ marginBottom: "16px" }}>
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
          </div>

          {/* Scrollable Content Area */}
          <div 
            style={{ 
              flex: 1,
              overflowY: "hidden", // Hide outer scroll
              overflowX: "hidden",
              paddingRight: "0px",
            }}
            className="satellite-popover-content"
          >

            {/* My Satellites Section - Simple Pinned List */}
            {satellites.length > 0 && (
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
                    📌 My Satellites
                  </Typography>
                  <Chip 
                    label={satellites.length} 
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
                    {filteredManagedSats.map((sat) => (
                      <ListItem key={sat._id} disablePadding>
                        <ListItemButton
                          onClick={() => {
                            dispatch(setSelectedSatId(sat._id));
                            setOpenPopover(false);
                          }}
                          sx={{
                            color: theme.primary,
                            backgroundColor: selectedSatId === sat._id ? `rgba(${theme.primaryRGB}, 0.15)` : "transparent",
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
                            <CountryFlag country={getCountryFromSatelliteName(sat.name)} size={16} />
                            <Box sx={{ flex: 1 }}>
                              <Typography 
                                sx={{
                                  fontFamily: "'Courier New', Courier, monospace",
                                  fontSize: "0.8rem",
                                  fontWeight: selectedSatId === sat._id ? "bold" : "normal",
                                  color: selectedSatId === sat._id ? theme.primary : theme.textPrimary,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap"
                                }}
                              >
                                {sat.name}
                              </Typography>
                              <Typography 
                                sx={{
                                  fontFamily: "'Courier New', Courier, monospace",
                                  fontSize: "0.65rem",
                                  color: `rgba(${theme.primaryRGB}, 0.6)`,
                                  marginTop: "1px"
                                }}
                              >
                                LEO • {sat.noradId || 'N/A'}
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

            {/* Discover Satellites Section with integrated search and filters */}
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
                  🔍 Discover More ({discoverStats.total.toLocaleString()})
                </Typography>
                <Chip 
                  label={`${filteredDiscoverableSats.length}${filteredDiscoverableSats.length === 20 ? '+' : ''}`} 
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
                placeholder="Search satellite database..."
                value={satelliteFilter}
                onChange={(e) => setSatelliteFilter(e.target.value)}
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

              {/* Orbit Type Filter Buttons */}
              <Box sx={{ 
                display: 'flex', 
                gap: '6px', 
                marginBottom: '12px',
                flexWrap: 'wrap'
              }}>
                {[
                  { key: 'LEO', count: discoverStats.leo },
                  { key: 'MEO', count: discoverStats.meo },
                  { key: 'GEO', count: discoverStats.geo },
                  { key: 'HEO', count: discoverStats.heo }
                ].map(({ key, count }) => (
                  <Chip
                    key={key}
                    label={`${key} (${count.toLocaleString()})`}
                    size="small"
                    clickable
                    onClick={() => toggleFilter(key)}
                    sx={{
                      backgroundColor: activeFilters.has(key) 
                        ? `rgba(${theme.secondaryRGB}, 0.3)` 
                        : `rgba(${theme.secondaryRGB}, 0.1)`,
                      color: activeFilters.has(key) ? theme.secondary : theme.textSecondary,
                      border: activeFilters.has(key) 
                        ? `1px solid ${theme.secondary}` 
                        : `1px solid rgba(${theme.secondaryRGB}, 0.3)`,
                      fontFamily: "'Courier New', Courier, monospace",
                      fontSize: "0.65rem",
                      height: "22px",
                      '&:hover': {
                        backgroundColor: `rgba(${theme.secondaryRGB}, 0.2)`,
                        transform: 'translateY(-1px)'
                      },
                      transition: 'all 0.2s ease'
                    }}
                  />
                ))}
                {activeFilters.size > 0 && (
                  <Chip
                    label="Clear"
                    size="small"
                    clickable
                    onClick={() => setActiveFilters(new Set())}
                    sx={{
                      backgroundColor: `rgba(255, 100, 100, 0.2)`,
                      color: theme.error || '#ff6464',
                      border: `1px solid ${theme.error || '#ff6464'}`,
                      fontFamily: "'Courier New', Courier, monospace",
                      fontSize: "0.65rem",
                      height: "22px",
                      '&:hover': {
                        backgroundColor: `rgba(255, 100, 100, 0.3)`,
                      }
                    }}
                  />
                )}
              </Box>

              {/* Satellite List */}
              {filteredDiscoverableSats.length > 0 ? (
                <>
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
                      {filteredDiscoverableSats.map((sat) => (
                        <ListItem key={sat.id} disablePadding>
                          <Tooltip title="Click to add and select this satellite" arrow placement="left">
                            <ListItemButton
                              onClick={async () => {
                                // Quick-add the satellite first, then select it
                                try {
                                  console.log("Full satellite object:", sat);
                                  console.log("Satellite celestrakData exists?", !!sat.celestrakData);
                                  if (sat.celestrakData) {
                                    console.log("CelesTrak data keys:", Object.keys(sat.celestrakData));
                                  }

                                  const requestBody: any = {
                                    name: sat.name,
                                    noradId: sat.noradId,
                                    type: 'live', // CelesTrak satellites are live
                                    description: `Added from CelesTrak - ${sat.description || 'Satellite from CelesTrak database'}`
                                  };

                                  // If we have the original CelesTrak data, include TLE data
                                  if (sat.celestrakData) {
                                    console.log("Including TLE data for satellite:", sat.name, sat.celestrakData);
                                    requestBody.tleData = sat.celestrakData;
                                  } else {
                                    console.log("No celestrakData available for satellite:", sat.name);
                                  }

                                  console.log("Sending satellite creation request:", requestBody);

                                  const response = await fetch('/api/satellites', {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify(requestBody),
                                  });

                                  if (response.ok) {
                                    const addedSatellite = await response.json();
                                    // Add the satellite to Redux state immediately
                                    dispatch(addSatellite(addedSatellite));
                                    // Select the newly added satellite
                                    dispatch(setSelectedSatId(addedSatellite._id));
                                    setOpenPopover(false);
                                  } else {
                                    const errorData = await response.text();
                                    console.error('Failed to add satellite:', response.status, response.statusText, errorData);
                                  }
                                } catch (error) {
                                  console.error('Failed to add satellite:', error);
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
                                  "& .satellite-name": {
                                    color: theme.secondary
                                  }
                                }
                              }}
                            >
                            <ListItemText 
                              primary={
                                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1 }}>
                                    <CountryFlag country={sat.country || 'Unknown'} size={16} />
                                    <Box sx={{ flex: 1 }}>
                                      <Typography 
                                        className="satellite-name"
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
                                        {sat.name}
                                      </Typography>
                                      <Typography 
                                        sx={{
                                          fontFamily: "'Courier New', Courier, monospace",
                                          fontSize: "0.6rem",
                                          color: "#888",
                                          marginTop: "1px"
                                        }}
                                      >
                                        {sat.orbitType || 'LEO'} • {sat.noradId || 'N/A'} • {sat.country || 'Unknown'}
                                      </Typography>
                                    </Box>
                                  </Box>
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation(); // Prevent the row click handler
                                      handleQuickAdd(sat);
                                    }}
                                    sx={{
                                      color: theme.secondary,
                                      padding: "3px",
                                      width: "20px",
                                      height: "20px",
                                      "&:hover": {
                                        backgroundColor: `rgba(${theme.secondaryRGB}, 0.2)`,
                                        transform: "scale(1.1)"
                                      }
                                    }}
                                  >
                                    <AddCircleOutlineIcon sx={{ fontSize: "14px" }} />
                                  </IconButton>
                                </Box>
                              }
                            />
                          </ListItemButton>
                          </Tooltip>
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                  {satelliteFilter && filteredDiscoverableSats.length === 20 && (
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: "#666", 
                        fontStyle: "italic",
                        textAlign: "center",
                        display: "block",
                        marginTop: "8px",
                        fontFamily: "'Courier New', Courier, monospace",
                        fontSize: "0.65rem"
                      }}
                    >
                      Showing first 20 results...
                    </Typography>
                  )}
                </>
              ) : (
                /* No results or loading state */
                <Box sx={{ textAlign: "center", padding: "20px" }}>
                  {loadingCelestrak ? (
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: "#ffaa00", 
                        fontFamily: "'Courier New', Courier, monospace",
                        fontSize: "0.75rem"
                      }}
                    >
                      ⟳ Loading satellites...
                    </Typography>
                  ) : (
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: "#666", 
                        fontFamily: "'Courier New', Courier, monospace",
                        fontSize: "0.75rem"
                      }}
                    >
                      {satelliteFilter && activeFilters.size > 0 
                        ? `No satellites found for "${satelliteFilter}" with selected filters`
                        : satelliteFilter 
                        ? `No satellites found for "${satelliteFilter}"`
                        : activeFilters.size > 0
                        ? 'No satellites match selected filters'
                        : 'Start typing to search satellites...'
                      }
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          </div>
        </div>
      )}
    </div>
  );
};

export default SatellitePopover;