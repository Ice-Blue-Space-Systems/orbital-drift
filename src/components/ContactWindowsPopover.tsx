import React, { useState, useEffect, useMemo, useCallback } from "react";
import { 
  IconButton, 
  Popover, 
  Box, 
  Typography,
  Paper,
  Chip,
  Divider,
  Tooltip,
  Badge
} from "@mui/material";
import EventIcon from "@mui/icons-material/Event";
import SignalCellularAltIcon from "@mui/icons-material/SignalCellularAlt";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import SkipPreviousIcon from "@mui/icons-material/SkipPrevious";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import FitScreenIcon from "@mui/icons-material/FitScreen";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import LocationDisabledIcon from "@mui/icons-material/LocationDisabled";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ContactWindows from "./ContactWindows";
import { useSelector } from "react-redux";
import { selectContactWindows, selectContactWindowsStatus } from "../store/contactWindowsSlice";
import { selectCesiumClockDate } from "../store/selectors/cesiumClockSelectors";
import { useTheme } from "../contexts/ThemeContext";
import { ContactWindow } from "../types";
import { useNavigate } from "react-router-dom";
import ContactWindowCountdown from "./ContactWindowCountdown";

// Mini Timeline Component - Memoized to prevent unnecessary re-renders
interface MiniTimelineProps {
  contactWindows: any[];
  currentTime: Date;
  centerTime: Date;
  zoom: number;
  theme: any;
}

const MiniTimeline: React.FC<MiniTimelineProps> = React.memo(({ 
  contactWindows, 
  currentTime, 
  centerTime, 
  zoom, 
  theme 
}) => {
  const timelineWidth = 700; // Available width in popover
  const timeSpan = (24 * 60 * 60 * 1000) / zoom; // 24 hours base, adjusted by zoom
  
  // Memoize startTime and endTime to prevent recreation on every render
  const startTime = useMemo(() => new Date(centerTime.getTime() - timeSpan / 2), [centerTime, timeSpan]);
  const endTime = useMemo(() => new Date(centerTime.getTime() + timeSpan / 2), [centerTime, timeSpan]);
  
  // Extract startTime value for dependency array
  const startTimeValue = startTime.getTime();
  
  const timeToPosition = useCallback((time: Date) => {
    const progress = (time.getTime() - startTimeValue) / timeSpan;
    return Math.max(0, Math.min(timelineWidth, progress * timelineWidth));
  }, [startTimeValue, timeSpan, timelineWidth]);
  
  // Throttle current time position updates to every 5 seconds for smoother UX
  // Extract current time value for dependency array
  const currentTimeThrottled = Math.floor(currentTime.getTime() / 5000) * 5000;
  const currentTimePosition = useMemo(() => {
    return timeToPosition(new Date(currentTimeThrottled));
  }, [currentTimeThrottled, timeToPosition]);
  
  // Memoize contact window elements to prevent recreation on every render
  const contactWindowElements = useMemo(() => {
    return contactWindows.map((window: any, index: number) => {
      const aosTime = new Date(window.scheduledAOS);
      const losTime = new Date(window.scheduledLOS);
      
      // Only render if window overlaps with visible timeline
      if (losTime < startTime || aosTime > endTime) return null;
      
      const startPos = timeToPosition(aosTime);
      const endPos = timeToPosition(losTime);
      const width = Math.max(2, endPos - startPos);
      
      const isActive = aosTime <= currentTime && currentTime <= losTime;
      const isPast = losTime < currentTime;
      
      return (
        <Tooltip 
          key={index}
          title={`${aosTime.toLocaleTimeString()} - ${losTime.toLocaleTimeString()}`}
          arrow
        >
          <Box
            sx={{
              position: 'absolute',
              left: `${startPos}px`,
              width: `${width}px`,
              height: '40px',
              top: '10px',
              backgroundColor: isActive 
                ? theme.primary 
                : isPast 
                  ? 'rgba(128, 128, 128, 0.6)' 
                  : theme.accent,
              border: `1px solid ${isActive ? theme.primary : isPast ? '#666' : theme.accent}`,
              borderRadius: '4px',
              cursor: 'pointer',
              opacity: isPast ? 0.5 : 1,
              animation: isActive ? 'pulse 2s infinite' : 'none',
              '&:hover': {
                opacity: 1,
                transform: 'scaleY(1.2)',
                zIndex: 10,
              },
              transition: 'all 0.2s ease',
            }}
          />
        </Tooltip>
      );
    });
  }, [contactWindows, startTime, endTime, currentTime, timeToPosition, theme]);
  
  return (
    <Box sx={{ position: 'relative', height: '80px', backgroundColor: 'rgba(0, 0, 0, 0.3)', borderRadius: '8px', overflow: 'hidden' }}>
      {/* Time Scale */}
      <Box sx={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        right: 0, 
        height: '20px', 
        borderBottom: `1px solid rgba(${theme.primaryRGB}, 0.3)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 8px',
        fontSize: '10px',
        color: theme.textSecondary
      }}>
        <span>{startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        <span>{centerTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        <span>{endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </Box>
      
      {/* Timeline Track */}
      <Box sx={{ position: 'absolute', top: '20px', left: 0, right: 0, bottom: 0 }}>
        {/* Contact Windows */}
        {contactWindowElements}
        
        {/* Current Time Indicator */}
        <Box
          sx={{
            position: 'absolute',
            left: `${currentTimePosition}px`,
            width: '2px',
            height: '100%',
            backgroundColor: theme.warning,
            boxShadow: `0 0 10px ${theme.warning}`,
            '&::before': {
              content: '""',
              position: 'absolute',
              top: '-4px',
              left: '-4px',
              width: '10px',
              height: '10px',
              backgroundColor: theme.warning,
              borderRadius: '50%',
              boxShadow: `0 0 6px ${theme.warning}`,
            }
          }}
        />
      </Box>
    </Box>
  );
});

// Time display component that updates every second instead of every render
const TimeDisplay: React.FC<{ time: Date }> = React.memo(({ time }) => {
  const [displayTime, setDisplayTime] = useState(time.toLocaleTimeString());
  
  // Extract time string for dependency array to avoid complex expressions
  const timeString = time.toDateString();
  
  useEffect(() => {
    // Update immediately when time prop changes
    setDisplayTime(time.toLocaleTimeString());
    
    const interval = setInterval(() => {
      setDisplayTime(time.toLocaleTimeString());
    }, 1000);
    
    return () => clearInterval(interval);
  }, [time, timeString]); // Include time as dependency
  
  return <>{displayTime}</>;
});

interface ContactWindowsPopoverProps {
  nextContactWindow?: ContactWindow | null;
  selectedSatelliteName?: string | null;
  selectedGroundStationName?: string | null;
  currentTime?: Date;
  // Legacy props for backward compatibility
  satelliteId?: string;
  groundStationId?: string;
  satelliteName?: string;
  groundStationName?: string;
  showPlaceholder?: boolean;
}

const ContactWindowsPopover: React.FC<ContactWindowsPopoverProps> = React.memo(({
  nextContactWindow,
  selectedSatelliteName,
  selectedGroundStationName,
  currentTime,
  // Legacy props
  satelliteId,
  groundStationId,
  satelliteName = "Unknown Satellite",
  groundStationName = "Unknown Ground Station",
  showPlaceholder = false,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const contactWindows = useSelector(selectContactWindows);
  const status = useSelector(selectContactWindowsStatus);
  const cesiumClockTime = useSelector(selectCesiumClockDate);
  const { theme } = useTheme();
  const navigate = useNavigate();
  
  // Timeline state
  const [followMode, setFollowMode] = useState(true);
  const [timelineZoom, setTimelineZoom] = useState(1);
  const [timelineCenter, setTimelineCenter] = useState(new Date());
  
  const open = Boolean(anchorEl);
  
  // Use new props or fall back to legacy props
  const displaySatelliteName = selectedSatelliteName || satelliteName;
  const displayGroundStationName = selectedGroundStationName || groundStationName;
  
  // Filter contact windows for selected satellite/ground station pair - memoized
  const filteredContactWindows = useMemo(() => {
    if (!satelliteId || !groundStationId) return [];
    
    console.log('ContactWindowsPopover: Filtering', {
      total: contactWindows.length,
      satelliteId,
      groundStationId
    });
    
    // Handle api- prefix for ID matching
    const propSatId = satelliteId.replace('api-', '');
    const propGsId = groundStationId.replace('api-', '');
    
    const filtered = contactWindows.filter((window: any) => {
      const windowSatId = window.satelliteId;
      const windowGsId = window.groundStationId;
      
      const satMatch = windowSatId === propSatId || windowSatId === satelliteId;
      const gsMatch = windowGsId === propGsId || windowGsId === groundStationId;
      
      return satMatch && gsMatch;
    });
    
    console.log('ContactWindowsPopover: Filtered result', {
      filtered: filtered.length
    });
    
    return filtered;
  }, [contactWindows, satelliteId, groundStationId]);
  
  // Current simulation time - memoized and only updates every 5 seconds to reduce re-renders
  // Extract cesiumClockTime value for dependency array
  const cesiumClockTimeValue = cesiumClockTime?.getTime() || Date.now();
  const currentTimeThrottled = Math.floor(cesiumClockTimeValue / 5000) * 5000;
  
  const currentSimTime = useMemo(() => {
    const time = cesiumClockTime || currentTime || new Date();
    // Round to nearest 5 seconds to reduce excessive updates
    const rounded = new Date(Math.floor(time.getTime() / 5000) * 5000);
    return rounded;
  }, [currentTimeThrottled, currentTime, cesiumClockTime]);
  
  // Expensive calculations - memoized to prevent recalculation on every render
  const windowStats = useMemo(() => {
    const upcomingWindows = filteredContactWindows.filter((window: any) => {
      return new Date(window.scheduledAOS) > currentSimTime;
    }).length;
    
    const activeWindow = filteredContactWindows.find((window: any) => {
      return new Date(window.scheduledAOS) <= currentSimTime && new Date(window.scheduledLOS) >= currentSimTime;
    });
    
    const todayWindows = filteredContactWindows.filter((w: any) => {
      const windowDate = new Date(w.scheduledAOS).toDateString();
      const today = currentSimTime.toDateString();
      return windowDate === today;
    }).length;
    
    const pastWindows = filteredContactWindows.filter((window: any) => {
      return new Date(window.scheduledLOS) < currentSimTime;
    }).length;
    
    // Get date range of available windows
    let dateRange = null;
    if (filteredContactWindows.length > 0) {
      const dates = filteredContactWindows.map((w: any) => new Date(w.scheduledAOS));
      const earliest = new Date(Math.min(...dates.map((d: Date) => d.getTime())));
      const latest = new Date(Math.max(...dates.map((d: Date) => d.getTime())));
      dateRange = { earliest, latest };
    }
    
    return { upcomingWindows, activeWindow, todayWindows, pastWindows, dateRange };
  }, [filteredContactWindows, currentSimTime]);
  
  const { upcomingWindows, activeWindow, todayWindows, pastWindows, dateRange } = windowStats;
  
  // Update timeline center when following mode is on - use throttled time
  useEffect(() => {
    if (followMode) {
      setTimelineCenter(currentSimTime);
    }
  }, [currentSimTime, followMode]);
  
  // Timeline control functions - memoized to prevent recreation on every render
  const handleJumpToNow = useCallback(() => {
    setTimelineCenter(currentSimTime);
    setFollowMode(true);
  }, [currentSimTime]);
  
  const handleJumpToStart = useCallback(() => {
    if (filteredContactWindows.length > 0) {
      const earliest = new Date(Math.min(...filteredContactWindows.map((w: any) => new Date(w.scheduledAOS).getTime())));
      setTimelineCenter(earliest);
      setFollowMode(false);
    }
  }, [filteredContactWindows]);
  
  const handleJumpToNext = useCallback(() => {
    const upcomingContactWindows = filteredContactWindows
      .filter((w: any) => new Date(w.scheduledAOS) > currentSimTime)
      .sort((a: any, b: any) => new Date(a.scheduledAOS).getTime() - new Date(b.scheduledAOS).getTime());
    
    if (upcomingContactWindows.length > 0) {
      setTimelineCenter(new Date(upcomingContactWindows[0].scheduledAOS));
      setFollowMode(false);
    }
  }, [filteredContactWindows, currentSimTime]);
  
  const handleZoomIn = useCallback(() => {
    setTimelineZoom(prev => Math.min(prev * 1.5, 10));
  }, []);
  
  const handleZoomOut = useCallback(() => {
    setTimelineZoom(prev => Math.max(prev / 1.5, 0.1));
  }, []);
  
  const handleFitAll = useCallback(() => {
    if (filteredContactWindows.length > 0) {
      const times = filteredContactWindows.flatMap((w: any) => [
        new Date(w.scheduledAOS).getTime(),
        new Date(w.scheduledLOS).getTime()
      ]);
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);
      const centerTime = new Date((minTime + maxTime) / 2);
      const timeSpan = maxTime - minTime;
      
      setTimelineCenter(centerTime);
      setTimelineZoom(Math.min(24 * 60 * 60 * 1000 / timeSpan, 10)); // Fit to roughly 24 hours max zoom
      setFollowMode(false);
    }
  }, [filteredContactWindows]);
  
  const handleToggleFollow = useCallback(() => {
    setFollowMode(prev => !prev);
  }, []);
  
  // Calculate stats - now using memoized values
  // const upcomingWindows = ... (removed, now in windowStats)
  // const activeWindow = ... (removed, now in windowStats)

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  // Memoize ContactWindows component to prevent unnecessary re-renders and API calls
  const memoizedContactWindows = useMemo(() => {
    if (satelliteId && groundStationId) {
      return (
        <ContactWindows 
          satelliteId={satelliteId} 
          groundStationId={groundStationId}
          compact={true}
        />
      );
    }
    return (
      <Typography variant="body2" sx={{ p: 2, color: theme.textSecondary }}>
        Select a satellite and ground station to view contact windows
      </Typography>
    );
  }, [satelliteId, groundStationId, theme.textSecondary]);

  // Memoize status functions to prevent recreation on every render
  const getStatusColor = useCallback(() => {
    if (showPlaceholder) return "#666"; // Placeholder state - gray
    if (activeWindow) return theme.primary; // Active contact - theme primary
    if (upcomingWindows > 0) return theme.accent; // Upcoming contacts - theme accent
    return "#666"; // No contacts - gray
  }, [showPlaceholder, activeWindow, upcomingWindows, theme.primary, theme.accent]);

  const getStatusIcon = useCallback(() => {
    if (activeWindow && !showPlaceholder) return <SignalCellularAltIcon sx={{ color: theme.primary }} />;
    return <EventIcon />;
  }, [activeWindow, showPlaceholder, theme.primary]);

  const getTooltipText = useCallback(() => {
    if (showPlaceholder) {
      return "Select a satellite and ground station to view contact windows";
    }
    if (activeWindow) return "Contact Window Active";
    if (upcomingWindows > 0) return `${upcomingWindows} Upcoming Contact${upcomingWindows !== 1 ? 's' : ''}`;
    return "No Upcoming Contacts";
  }, [showPlaceholder, activeWindow, upcomingWindows]);

  return (
    <>
      <Tooltip 
        title={getTooltipText()}
        arrow
      >
        <Badge 
          badgeContent={
            showPlaceholder 
              ? 0 
              : activeWindow 
                ? "LIVE" 
                : upcomingWindows > 0 
                  ? upcomingWindows 
                  : 0
          }
          color={activeWindow && !showPlaceholder ? "success" : "warning"}
          variant={activeWindow && !showPlaceholder ? "standard" : "dot"}
          invisible={showPlaceholder || (!activeWindow && upcomingWindows === 0)}
        >
          <IconButton
            onClick={handleClick}
            sx={{
              color: getStatusColor(),
              borderRadius: "8px",
              border: `1px solid ${getStatusColor()}`,
              backgroundColor: "rgba(0, 0, 0, 0.3)",
              "&:hover": {
                backgroundColor: `${getStatusColor()}15`,
                borderColor: getStatusColor(),
              },
              animation: activeWindow && !showPlaceholder ? "pulse 2s infinite" : "none",
              "@keyframes pulse": {
                "0%": {
                  boxShadow: `0 0 0 0 ${getStatusColor()}40`,
                },
                "70%": {
                  boxShadow: `0 0 0 6px ${getStatusColor()}00`,
                },
                "100%": {
                  boxShadow: `0 0 0 0 ${getStatusColor()}00`,
                },
              },
            }}
          >
            {getStatusIcon()}
          </IconButton>
        </Badge>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        PaperProps={{
          sx: {
            width: '800px',
            maxHeight: '700px',
            backgroundColor: theme.backgroundDark,
            backdropFilter: 'blur(10px)',
            border: `1px solid ${theme.primary}`,
            borderRadius: '12px',
            boxShadow: `0 8px 32px rgba(${theme.primaryRGB}, 0.2)`,
            fontFamily: "'Courier New', Courier, monospace",
          }
        }}
      >
        <Paper 
          elevation={0}
          sx={{ 
            backgroundColor: 'transparent',
            padding: 0,
            color: theme.primary
          }}
        >
          {showPlaceholder ? (
            /* Placeholder Content */
            <Box sx={{ 
              padding: 3,
              textAlign: 'center',
              minHeight: '200px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <EventIcon sx={{ fontSize: 48, color: '#666', mb: 2 }} />
              <Typography variant="h6" sx={{ 
                color: '#666', 
                fontFamily: 'inherit',
                fontWeight: 'bold',
                mb: 1
              }}>
                NO SELECTION
              </Typography>
              <Typography variant="body2" sx={{ 
                color: '#888', 
                fontFamily: 'inherit', 
                textAlign: 'center',
                mb: 2
              }}>
                Select a satellite and ground station to view<br />
                contact windows and communication schedules
              </Typography>
              <Box sx={{ 
                mt: 2, 
                padding: 2, 
                backgroundColor: `rgba(${theme.primaryRGB}, 0.05)`,
                border: `1px solid rgba(${theme.primaryRGB}, 0.2)`,
                borderRadius: '8px',
                width: '100%',
                maxWidth: '300px'
              }}>
                <Typography variant="caption" sx={{ 
                  color: theme.primary, 
                  fontFamily: 'inherit',
                  display: 'block',
                  textAlign: 'center'
                }}>
                  TIP: Use the satellite and ground station<br />
                  buttons above to make your selection
                </Typography>
              </Box>
            </Box>
          ) : (
            /* Normal Content */
            <>
              {/* Header */}
              <Box sx={{ 
                padding: 2, 
                borderBottom: `1px solid rgba(${theme.primaryRGB}, 0.3)`,
                background: `linear-gradient(135deg, rgba(${theme.primaryRGB}, 0.1) 0%, rgba(${theme.primaryRGB}, 0.05) 100%)`
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      color: theme.primary, 
                      fontFamily: 'inherit',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}
                  >
                    <EventIcon /> CONTACT WINDOWS
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {/* Mission Planner Button */}
                    <Tooltip title="Open Full Mission Planner" arrow>
                      <IconButton
                        size="small"
                        onClick={() => {
                          handleClose(); // Close the popover first
                          navigate('/timeline');
                        }}
                        sx={{
                          background: `linear-gradient(135deg, ${theme.primary}20, ${theme.primary}10)`,
                          border: `1px solid ${theme.primary}40`,
                          color: theme.primary,
                          borderRadius: '8px',
                          padding: '6px 12px',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            background: `linear-gradient(135deg, ${theme.primary}30, ${theme.primary}20)`,
                            border: `1px solid ${theme.primary}60`,
                            transform: 'translateY(-1px)',
                            boxShadow: `0 4px 12px ${theme.primary}20`
                          }
                        }}
                      >
                        <RocketLaunchIcon sx={{ fontSize: 16, mr: 0.5 }} />
                        <Typography variant="caption" sx={{ fontSize: '11px', fontWeight: 'bold' }}>
                          MISSION
                        </Typography>
                        <OpenInNewIcon sx={{ fontSize: 12, ml: 0.5, opacity: 0.7 }} />
                      </IconButton>
                    </Tooltip>
                    
                    {/* Status Chips */}
                    {activeWindow && (
                      <Chip 
                        label="LIVE" 
                        size="small"
                        sx={{
                          backgroundColor: theme.success,
                          color: theme.backgroundDark,
                          fontWeight: 'bold',
                          animation: 'pulse 2s infinite',
                        }}
                      />
                    )}
                    {status === 'loading' && (
                      <Chip 
                        label="LOADING" 
                        size="small"
                        sx={{
                          backgroundColor: theme.warning,
                          color: theme.backgroundDark,
                          fontWeight: 'bold',
                        }}
                      />
                    )}
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Typography variant="body2" sx={{ color: '#aaa', fontFamily: 'inherit' }}>
                    SAT: {displaySatelliteName}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#aaa', fontFamily: 'inherit' }}>
                    GS: {displayGroundStationName}
                  </Typography>
                </Box>
              </Box>

              {/* Status Bar */}
              <Box sx={{ 
                padding: 1.5, 
                borderBottom: `1px solid rgba(${theme.primaryRGB}, 0.2)`,
                backgroundColor: theme.backgroundSecondary
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: theme.textSecondary, fontFamily: 'inherit' }}>
                        UPCOMING
                      </Typography>
                      <Typography variant="h6" sx={{ color: theme.primary, fontFamily: 'inherit', lineHeight: 1 }}>
                        {upcomingWindows}
                      </Typography>
                    </Box>
                    <Divider orientation="vertical" flexItem sx={{ borderColor: theme.textSecondary }} />
                    <Box>
                      <Typography variant="caption" sx={{ color: theme.textSecondary, fontFamily: 'inherit' }}>
                        TOTAL TODAY
                      </Typography>
                      <Typography variant="h6" sx={{ color: theme.primary, fontFamily: 'inherit', lineHeight: 1 }}>
                        {todayWindows}
                      </Typography>
                    </Box>
                    <Divider orientation="vertical" flexItem sx={{ borderColor: theme.textSecondary }} />
                    <Box>
                      <Typography variant="caption" sx={{ color: theme.textSecondary, fontFamily: 'inherit' }}>
                        STATUS
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        color: activeWindow ? theme.primary : theme.textSecondary, 
                        fontFamily: 'inherit', 
                        lineHeight: 1,
                        fontWeight: 'bold'
                      }}>
                        {activeWindow ? 'IN CONTACT' : 'STANDBY'}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Typography variant="caption" sx={{ color: theme.textSecondary, fontFamily: 'inherit' }}>
                    <TimeDisplay time={currentSimTime} />
                  </Typography>
                </Box>
              </Box>

              {/* Contact Window Countdown */}
              <Box sx={{ padding: 1.5 }}>
                <ContactWindowCountdown 
                  compact={true}
                  showRefreshButton={true}
                  closable={false}
                />
              </Box>

              {/* Timeline Controls */}
              <Box sx={{ 
                padding: 2, 
                borderBottom: `1px solid rgba(${theme.primaryRGB}, 0.2)`,
                backgroundColor: theme.backgroundSecondary
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: theme.primary, fontFamily: 'inherit', fontWeight: 'bold' }}>
                    TIMELINE CONTROLS
                  </Typography>
                  <Typography variant="caption" sx={{ color: theme.textSecondary, fontFamily: 'inherit' }}>
                    <TimeDisplay time={currentSimTime} /> UTC
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                  {/* Navigation Controls */}
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 0.5, 
                    padding: '4px 8px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    border: `1px solid rgba(${theme.primaryRGB}, 0.2)`,
                  }}>
                    <Tooltip title="Jump to Start" arrow>
                      <IconButton 
                        onClick={handleJumpToStart} 
                        size="small"
                        sx={{ color: theme.textSecondary, '&:hover': { color: theme.primary } }}
                      >
                        <SkipPreviousIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Jump to Now" arrow>
                      <IconButton 
                        onClick={handleJumpToNow} 
                        size="small"
                        sx={{ color: theme.textSecondary, '&:hover': { color: theme.primary } }}
                      >
                        <AccessTimeIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={followMode ? "Disable Follow Mode" : "Enable Follow Mode"} arrow>
                      <IconButton 
                        onClick={handleToggleFollow} 
                        size="small"
                        sx={{ 
                          color: followMode ? theme.primary : theme.textSecondary,
                          '&:hover': { color: theme.primary }
                        }}
                      >
                        {followMode ? <MyLocationIcon fontSize="small" /> : <LocationDisabledIcon fontSize="small" />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Jump to Next Window" arrow>
                      <IconButton 
                        onClick={handleJumpToNext} 
                        size="small"
                        sx={{ color: theme.textSecondary, '&:hover': { color: theme.primary } }}
                      >
                        <SkipNextIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  
                  {/* Zoom Controls */}
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 0.5, 
                    padding: '4px 8px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    border: `1px solid rgba(${theme.primaryRGB}, 0.2)`,
                  }}>
                    <Tooltip title="Zoom In" arrow>
                      <IconButton 
                        onClick={handleZoomIn} 
                        size="small"
                        sx={{ color: theme.textSecondary, '&:hover': { color: theme.primary } }}
                      >
                        <ZoomInIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Zoom Out" arrow>
                      <IconButton 
                        onClick={handleZoomOut} 
                        size="small"
                        sx={{ color: theme.textSecondary, '&:hover': { color: theme.primary } }}
                      >
                        <ZoomOutIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Fit All Windows" arrow>
                      <IconButton 
                        onClick={handleFitAll} 
                        size="small"
                        sx={{ color: theme.textSecondary, '&:hover': { color: theme.primary } }}
                      >
                        <FitScreenIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  
                  {/* Status Indicators */}
                  <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
                    {followMode && (
                      <Chip 
                        label="FOLLOW" 
                        size="small"
                        sx={{
                          backgroundColor: theme.primary,
                          color: theme.backgroundDark,
                          fontWeight: 'bold',
                          fontSize: '0.7rem',
                        }}
                      />
                    )}
                    <Chip 
                      label={`ZOOM ${timelineZoom.toFixed(1)}x`} 
                      size="small"
                      variant="outlined"
                      sx={{
                        borderColor: theme.textSecondary,
                        color: theme.textSecondary,
                        fontSize: '0.7rem',
                      }}
                    />
                  </Box>
                </Box>
              </Box>

              {/* Mini Timeline Visualization */}
              <Box sx={{ 
                padding: 2, 
                borderBottom: `1px solid rgba(${theme.primaryRGB}, 0.2)`,
                backgroundColor: theme.backgroundSecondary,
                minHeight: '120px'
              }}>
                <Typography variant="subtitle2" sx={{ color: theme.primary, fontFamily: 'inherit', fontWeight: 'bold', mb: 2 }}>
                  CONTACT TIMELINE
                </Typography>
                <MiniTimeline 
                  contactWindows={filteredContactWindows}
                  currentTime={currentSimTime}
                  centerTime={timelineCenter}
                  zoom={timelineZoom}
                  theme={theme}
                />
              </Box>

              {/* Contact Windows Content */}
              <Box sx={{ maxHeight: '400px', overflow: 'hidden' }}>
                {memoizedContactWindows}
              </Box>
            </>
          )}
        </Paper>
      </Popover>
    </>
  );
});

export default ContactWindowsPopover;