import React, { useState, useRef, useEffect } from "react";
import { 
  IconButton, 
  Popover, 
  Box, 
  Typography,
  Paper,
  Tooltip,
  Chip,
  ButtonGroup
} from "@mui/material";
import TimelineIcon from "@mui/icons-material/Timeline";
import LaunchIcon from "@mui/icons-material/Launch";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import SkipPreviousIcon from "@mui/icons-material/SkipPrevious";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import FitScreenIcon from "@mui/icons-material/FitScreen";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import LocationDisabledIcon from "@mui/icons-material/LocationDisabled";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import { useSelectedEntities } from "../hooks/useSelectedEntities";
import { selectContactWindows } from "../store/contactWindowsSlice";
import { selectCesiumClockDate } from "../store/selectors/cesiumClockSelectors";

const TimelinePopover: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [timelineZoom, setTimelineZoom] = useState(1); // 1 = 24 hours, 2 = 12 hours, 0.5 = 48 hours
  const [timelineCenter, setTimelineCenter] = useState(0); // offset from current time in hours
  const [followMode, setFollowMode] = useState(true);
  const { theme } = useTheme();
  const navigate = useNavigate();
  
  const {
    selectedSatelliteId,
    selectedGroundStationId,
    selectedSatellite,
    selectedGroundStation,
  } = useSelectedEntities();
  
  const contactWindows = useSelector(selectContactWindows);
  const cesiumClockTime = useSelector(selectCesiumClockDate);
  
  const open = Boolean(anchorEl);
  
  // Filter contact windows for the selected pair
  const relevantWindows = contactWindows.filter((window: any) => {
    if (!selectedSatelliteId || !selectedGroundStationId) return false;
    
    // Handle both ObjectId and string formats
    const matchesSatellite = String(window.satelliteId) === String(selectedSatelliteId).replace('api-', '');
    const matchesGroundStation = String(window.groundStationId) === String(selectedGroundStationId).replace('api-', '');
    
    return matchesSatellite && matchesGroundStation;
  });
  
  // Calculate upcoming contact windows
  const upcomingWindows = relevantWindows.filter((window: any) => {
    const now = cesiumClockTime || new Date();
    return new Date(window.scheduledAOS) > now;
  });

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handlePopout = () => {
    navigate('/timeline');
    handleClose();
  };

  // Timeline control functions
  const handleZoomIn = () => {
    setTimelineZoom(prev => Math.min(prev * 2, 8)); // Max 3 hours
  };

  const handleZoomOut = () => {
    setTimelineZoom(prev => Math.max(prev / 2, 0.125)); // Min 7 days
  };

  const handleJumpToNow = () => {
    setTimelineCenter(0);
    setFollowMode(true);
  };

  const handleJumpToNext = () => {
    if (upcomingWindows.length > 0) {
      const nextWindow = upcomingWindows[0];
      const now = cesiumClockTime || new Date();
      const nextWindowTime = new Date(nextWindow.scheduledAOS);
      const offsetHours = (nextWindowTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      setTimelineCenter(offsetHours);
      setFollowMode(false);
    }
  };

  const handleJumpToStart = () => {
    if (relevantWindows.length > 0) {
      const earliestWindow = relevantWindows.reduce((earliest: any, current: any) => 
        new Date(current.scheduledAOS) < new Date(earliest.scheduledAOS) ? current : earliest
      );
      const now = cesiumClockTime || new Date();
      const earliestTime = new Date(earliestWindow.scheduledAOS);
      const offsetHours = (earliestTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      setTimelineCenter(offsetHours);
      setFollowMode(false);
    }
  };

  const handleFitAll = () => {
    if (relevantWindows.length === 0) return;
    
    const times = relevantWindows.flatMap((w: any) => [
      new Date(w.scheduledAOS).getTime(),
      new Date(w.scheduledLOS).getTime()
    ]);
    
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const duration = maxTime - minTime;
    const now = cesiumClockTime || new Date();
    
    // Center between min and max
    const centerTime = (minTime + maxTime) / 2;
    const offsetHours = (centerTime - now.getTime()) / (1000 * 60 * 60);
    setTimelineCenter(offsetHours);
    
    // Set zoom to fit all windows with some padding
    const durationHours = duration / (1000 * 60 * 60);
    const targetZoom = 24 / (durationHours * 1.2); // 20% padding
    setTimelineZoom(Math.max(0.125, Math.min(8, targetZoom)));
    setFollowMode(false);
  };

  const handleToggleFollow = () => {
    setFollowMode(prev => {
      if (!prev) {
        setTimelineCenter(0); // Jump back to now when enabling follow
      }
      return !prev;
    });
  };

  // Auto-update timeline center when in follow mode
  useEffect(() => {
    if (followMode) {
      setTimelineCenter(0);
    }
  }, [cesiumClockTime, followMode]);

  const getStatusColor = () => {
    if (!selectedSatelliteId || !selectedGroundStationId) return "#666";
    if (upcomingWindows.length > 0) return theme.primary;
    return "#666";
  };

  const getTooltipText = () => {
    if (!selectedSatelliteId || !selectedGroundStationId) {
      return "Select a satellite and ground station to view timeline";
    }
    if (upcomingWindows.length > 0) {
      return `Mission Timeline - ${upcomingWindows.length} upcoming contact${upcomingWindows.length !== 1 ? 's' : ''}`;
    }
    return "Mission Timeline - No upcoming contacts";
  };

  // Enhanced timeline component with zoom and pan controls
  const SimpleTimeline = () => {
    const now = cesiumClockTime || new Date();
    const baseHours = 24 / timelineZoom; // How many hours to show total
    const centerTime = now.getTime() + (timelineCenter * 60 * 60 * 1000); // Center point
    const startTime = centerTime - (baseHours / 2 * 60 * 60 * 1000);
    const endTime = centerTime + (baseHours / 2 * 60 * 60 * 1000);
    
    return (
      <Box sx={{ 
        position: 'relative',
        height: '180px', // Taller for better visibility
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        borderRadius: '8px',
        overflow: 'hidden',
        border: `1px solid rgba(${theme.primaryRGB}, 0.2)`
      }}>
        {/* Time axis */}
        <Box sx={{ 
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '24px',
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          display: 'flex',
          alignItems: 'center',
          paddingX: 1
        }}>
          <Typography variant="caption" sx={{ color: '#888', fontSize: '9px', fontFamily: 'inherit' }}>
            {new Date(startTime).toLocaleDateString()} {new Date(startTime).toLocaleTimeString()}
          </Typography>
          <Box sx={{ flex: 1 }} />
          {/* Show center time info */}
          <Typography variant="caption" sx={{ color: theme.primary, fontSize: '9px', fontFamily: 'inherit' }}>
            {followMode ? 'NOW' : `${Math.abs(timelineCenter).toFixed(1)}h ${timelineCenter >= 0 ? 'future' : 'past'}`}
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Typography variant="caption" sx={{ color: '#888', fontSize: '9px', fontFamily: 'inherit' }}>
            {new Date(endTime).toLocaleDateString()} {new Date(endTime).toLocaleTimeString()}
          </Typography>
        </Box>
        
        {/* Time grid lines */}
        {(() => {
          const lines = [];
          const gridInterval = baseHours > 48 ? 24 : baseHours > 12 ? 6 : baseHours > 6 ? 2 : 1; // hours between lines
          const intervalMs = gridInterval * 60 * 60 * 1000;
          
          for (let time = Math.ceil(startTime / intervalMs) * intervalMs; time <= endTime; time += intervalMs) {
            const percent = ((time - startTime) / (endTime - startTime)) * 100;
            lines.push(
              <Box
                key={time}
                sx={{
                  position: 'absolute',
                  left: `${percent}%`,
                  top: 0,
                  bottom: '24px',
                  width: '1px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  zIndex: 1
                }}
              />
            );
          }
          return lines;
        })()}
        
        {/* Current time indicator */}
        <Box sx={{
          position: 'absolute',
          left: `${((now.getTime() - startTime) / (endTime - startTime)) * 100}%`,
          top: 0,
          bottom: 0,
          width: '2px',
          backgroundColor: theme.accent,
          zIndex: 3,
          boxShadow: `0 0 8px ${theme.accent}`
        }} />
        
        {/* Contact windows */}
        {relevantWindows.map((window: any, index: number) => {
          const windowStart = new Date(window.scheduledAOS).getTime();
          const windowEnd = new Date(window.scheduledLOS).getTime();
          
          // Only show windows within our time range
          if (windowEnd < startTime || windowStart > endTime) return null;
          
          const leftPercent = Math.max(0, ((windowStart - startTime) / (endTime - startTime)) * 100);
          const rightPercent = Math.min(100, ((windowEnd - startTime) / (endTime - startTime)) * 100);
          const widthPercent = rightPercent - leftPercent;
          
          const duration = Math.round((windowEnd - windowStart) / 60000);
          const isUpcoming = windowStart > now.getTime();
          const isCurrent = windowStart <= now.getTime() && windowEnd >= now.getTime();
          
          return (
            <Box
              key={index}
              sx={{
                position: 'absolute',
                left: `${leftPercent}%`,
                width: `${widthPercent}%`,
                top: '20px',
                height: '120px',
                backgroundColor: isCurrent ? theme.accent : (isUpcoming ? theme.primary : 'rgba(100, 100, 100, 0.5)'),
                borderRadius: '4px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                border: isCurrent ? `2px solid ${theme.accent}` : 'none',
                boxShadow: isCurrent ? `0 0 15px ${theme.accent}66` : 'none',
                '&:hover': {
                  backgroundColor: isCurrent ? theme.accent : (isUpcoming ? theme.secondary : 'rgba(150, 150, 150, 0.7)'),
                  transform: 'scaleY(1.1)',
                  zIndex: 4
                }
              }}
              title={`Contact Window: ${new Date(windowStart).toLocaleString()} - ${new Date(windowEnd).toLocaleString()}\nDuration: ${duration} minutes${isCurrent ? '\n*** ACTIVE NOW ***' : ''}`}
            >
              <Typography sx={{ 
                color: (isCurrent || isUpcoming) ? theme.backgroundDark : '#fff',
                fontSize: '11px',
                fontWeight: 'bold',
                fontFamily: 'inherit'
              }}>
                {duration}m
              </Typography>
              {isCurrent && (
                <Typography sx={{ 
                  color: theme.backgroundDark,
                  fontSize: '8px',
                  fontWeight: 'bold',
                  fontFamily: 'inherit',
                  marginTop: '2px'
                }}>
                  ACTIVE
                </Typography>
              )}
            </Box>
          );
        })}
        
        {/* No windows message */}
        {relevantWindows.length === 0 && (
          <Box sx={{ 
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#666',
            textAlign: 'center',
            fontSize: '12px',
            fontFamily: 'inherit'
          }}>
            {selectedGroundStationId?.startsWith('predefined-') 
              ? 'No stored contact windows for predefined ground station'
              : 'No contact windows available for this satellite-ground station pair'
            }
          </Box>
        )}
      </Box>
    );
  };

  return (
    <>
      <Tooltip title={getTooltipText()} arrow>
        <IconButton
          onClick={handleClick}
          className="icon-button"
          sx={{
            color: getStatusColor(),
          }}
        >
          <TimelineIcon fontSize="small" />
        </IconButton>
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
            background: 'transparent',
            boxShadow: 'none',
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
          {!selectedSatelliteId || !selectedGroundStationId ? (
            /* Placeholder Content */
            <Box sx={{ 
              padding: 3,
              textAlign: 'center',
              minHeight: '200px',
              minWidth: '350px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              background: `linear-gradient(135deg, 
                rgba(${theme.primaryRGB}, 0.15) 0%, 
                rgba(${theme.primaryRGB}, 0.05) 100%)`,
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: `1px solid rgba(${theme.primaryRGB}, 0.3)`,
              borderRadius: 2,
            }}>
              <TimelineIcon sx={{ fontSize: 48, color: '#666', mb: 2 }} />
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
                maxWidth: '250px'
              }}>
                Select a satellite and ground station to view the mission timeline
              </Typography>
            </Box>
          ) : (
            <>
              {/* Header */}
              <Box sx={{ 
                padding: 2, 
                borderBottom: `1px solid rgba(${theme.primaryRGB}, 0.2)`,
                background: `linear-gradient(135deg, 
                  rgba(${theme.primaryRGB}, 0.15) 0%, 
                  rgba(${theme.primaryRGB}, 0.05) 100%)`,
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: `1px solid rgba(${theme.primaryRGB}, 0.3)`,
                borderTopLeftRadius: 8,
                borderTopRightRadius: 8,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Typography variant="h6" sx={{ 
                    color: theme.primary, 
                    fontFamily: 'inherit',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <TimelineIcon /> MISSION TIMELINE
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {upcomingWindows.length > 0 && (
                      <Chip 
                        label={`${upcomingWindows.length} UPCOMING`}
                        size="small"
                        sx={{
                          backgroundColor: theme.primary,
                          color: theme.backgroundDark,
                          fontWeight: 'bold',
                        }}
                      />
                    )}
                  </Box>
                </Box>
                
                <Tooltip title="Open Full Mission Planner" arrow>
                  <IconButton
                    onClick={handlePopout}
                    size="small"
                    sx={{
                      color: theme.primary,
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: 1,
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        transform: 'scale(1.1)',
                      },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <LaunchIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>

              {/* Timeline Content */}
              <Box sx={{ 
                minWidth: '700px', // Much wider for better timeline visibility
                background: `linear-gradient(135deg, 
                  rgba(${theme.primaryRGB}, 0.1) 0%, 
                  rgba(${theme.primaryRGB}, 0.02) 100%)`,
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: `1px solid rgba(${theme.primaryRGB}, 0.3)`,
                borderTop: 'none',
                borderBottomLeftRadius: 8,
                borderBottomRightRadius: 8,
              }}>
                {/* Timeline Controls */}
                <Box sx={{ 
                  padding: 1.5, 
                  borderBottom: `1px solid rgba(${theme.primaryRGB}, 0.2)`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  {/* Navigation Controls */}
                  <ButtonGroup variant="outlined" size="small" sx={{ 
                    '& .MuiButton-root': { 
                      borderColor: `rgba(${theme.primaryRGB}, 0.3)`,
                      color: theme.primary,
                      '&:hover': {
                        borderColor: `rgba(${theme.primaryRGB}, 0.5)`,
                        backgroundColor: `rgba(${theme.primaryRGB}, 0.1)`
                      }
                    } 
                  }}>
                    <Tooltip title="Jump to First Window" arrow>
                      <IconButton 
                        onClick={handleJumpToStart}
                        disabled={relevantWindows.length === 0}
                        sx={{ color: theme.primary, '&:hover': { backgroundColor: `rgba(${theme.primaryRGB}, 0.1)` } }}
                      >
                        <SkipPreviousIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Jump to Now" arrow>
                      <IconButton 
                        onClick={handleJumpToNow}
                        sx={{ color: theme.primary, '&:hover': { backgroundColor: `rgba(${theme.primaryRGB}, 0.1)` } }}
                      >
                        <AccessTimeIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={followMode ? "Disable Follow Mode" : "Enable Follow Mode"} arrow>
                      <IconButton 
                        onClick={handleToggleFollow}
                        sx={{ 
                          color: followMode ? theme.accent : theme.primary,
                          backgroundColor: followMode ? `rgba(${theme.primaryRGB}, 0.2)` : 'transparent',
                          '&:hover': { backgroundColor: `rgba(${theme.primaryRGB}, 0.1)` }
                        }}
                      >
                        {followMode ? <MyLocationIcon fontSize="small" /> : <LocationDisabledIcon fontSize="small" />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Jump to Next Window" arrow>
                      <IconButton 
                        onClick={handleJumpToNext}
                        disabled={upcomingWindows.length === 0}
                        sx={{ color: theme.primary, '&:hover': { backgroundColor: `rgba(${theme.primaryRGB}, 0.1)` } }}
                      >
                        <SkipNextIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </ButtonGroup>

                  {/* Zoom Info */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" sx={{ color: '#aaa', fontFamily: 'inherit' }}>
                      Showing {(24 / timelineZoom).toFixed(1)}h
                    </Typography>
                    <Chip 
                      label={followMode ? "FOLLOW" : "MANUAL"}
                      size="small"
                      sx={{
                        backgroundColor: followMode ? theme.accent : 'rgba(100, 100, 100, 0.3)',
                        color: followMode ? theme.backgroundDark : '#fff',
                        fontWeight: 'bold',
                        fontSize: '10px'
                      }}
                    />
                  </Box>

                  {/* Zoom Controls */}
                  <ButtonGroup variant="outlined" size="small" sx={{ 
                    '& .MuiButton-root': { 
                      borderColor: `rgba(${theme.primaryRGB}, 0.3)`,
                      color: theme.primary,
                      '&:hover': {
                        borderColor: `rgba(${theme.primaryRGB}, 0.5)`,
                        backgroundColor: `rgba(${theme.primaryRGB}, 0.1)`
                      }
                    } 
                  }}>
                    <Tooltip title="Zoom In" arrow>
                      <IconButton 
                        onClick={handleZoomIn}
                        disabled={timelineZoom >= 8}
                        sx={{ color: theme.primary, '&:hover': { backgroundColor: `rgba(${theme.primaryRGB}, 0.1)` } }}
                      >
                        <ZoomInIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Zoom Out" arrow>
                      <IconButton 
                        onClick={handleZoomOut}
                        disabled={timelineZoom <= 0.125}
                        sx={{ color: theme.primary, '&:hover': { backgroundColor: `rgba(${theme.primaryRGB}, 0.1)` } }}
                      >
                        <ZoomOutIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Fit All Windows" arrow>
                      <IconButton 
                        onClick={handleFitAll}
                        disabled={relevantWindows.length === 0}
                        sx={{ color: theme.primary, '&:hover': { backgroundColor: `rgba(${theme.primaryRGB}, 0.1)` } }}
                      >
                        <FitScreenIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </ButtonGroup>
                </Box>

                {/* Satellite and Ground Station Info */}
                <Box sx={{ padding: 1.5, borderBottom: `1px solid rgba(${theme.primaryRGB}, 0.2)` }}>
                  <Box sx={{ display: 'flex', gap: 2, marginBottom: 1, justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Typography variant="body2" sx={{ color: '#aaa', fontFamily: 'inherit' }}>
                        SAT: {selectedSatellite?.name || selectedSatelliteId}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#aaa', fontFamily: 'inherit' }}>
                        GS: {selectedGroundStation?.name || selectedGroundStationId}
                      </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ color: theme.primary, fontFamily: 'inherit' }}>
                      {relevantWindows.length} contact window{relevantWindows.length !== 1 ? 's' : ''} found
                    </Typography>
                  </Box>
                </Box>

                {/* Enhanced Timeline */}
                <Box sx={{ padding: 1.5 }}>
                  <SimpleTimeline />
                </Box>
              </Box>
            </>
          )}
        </Paper>
      </Popover>
    </>
  );
};

export default TimelinePopover;