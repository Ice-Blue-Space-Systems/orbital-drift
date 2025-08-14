import React, { useState, useRef, useEffect } from "react";
import { 
  IconButton, 
  Popover, 
  Box, 
  Typography,
  Paper,
  Tooltip,
  Chip
} from "@mui/material";
import TimelineIcon from "@mui/icons-material/Timeline";
import LaunchIcon from "@mui/icons-material/Launch";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import { useSelectedEntities } from "../hooks/useSelectedEntities";
import { selectContactWindows } from "../store/contactWindowsSlice";

const TimelinePopover: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const { theme } = useTheme();
  const navigate = useNavigate();
  
  const {
    selectedSatelliteId,
    selectedGroundStationId,
    selectedSatellite,
    selectedGroundStation,
  } = useSelectedEntities();
  
  const contactWindows = useSelector(selectContactWindows);
  const cesiumClockTime = useSelector((state: any) => state.cesiumClock.utc);
  
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

  // Simple timeline component using CSS bars instead of vis-timeline
  const SimpleTimeline = () => {
    const now = cesiumClockTime || new Date();
    const timeRange = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    const startTime = now.getTime() - (2 * 60 * 60 * 1000); // 2 hours before now
    const endTime = now.getTime() + (22 * 60 * 60 * 1000); // 22 hours after now
    
    return (
      <Box sx={{ 
        position: 'relative',
        height: '120px',
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
          height: '20px',
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          display: 'flex',
          alignItems: 'center',
          paddingX: 1
        }}>
          <Typography variant="caption" sx={{ color: '#888', fontSize: '10px', fontFamily: 'inherit' }}>
            {new Date(startTime).toLocaleTimeString()}
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Typography variant="caption" sx={{ color: theme.primary, fontSize: '10px', fontFamily: 'inherit' }}>
            NOW
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Typography variant="caption" sx={{ color: '#888', fontSize: '10px', fontFamily: 'inherit' }}>
            {new Date(endTime).toLocaleTimeString()}
          </Typography>
        </Box>
        
        {/* Current time indicator */}
        <Box sx={{
          position: 'absolute',
          left: `${((now.getTime() - startTime) / (endTime - startTime)) * 100}%`,
          top: 0,
          bottom: 0,
          width: '2px',
          backgroundColor: theme.accent,
          zIndex: 2
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
          
          return (
            <Box
              key={index}
              sx={{
                position: 'absolute',
                left: `${leftPercent}%`,
                width: `${widthPercent}%`,
                top: '10px',
                height: '80px',
                backgroundColor: isUpcoming ? theme.primary : 'rgba(100, 100, 100, 0.5)',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: isUpcoming ? theme.accent : 'rgba(150, 150, 150, 0.7)',
                  transform: 'scaleY(1.1)'
                }
              }}
              title={`Contact Window: ${new Date(windowStart).toLocaleString()} - ${new Date(windowEnd).toLocaleString()}\nDuration: ${duration} minutes`}
            >
              <Typography sx={{ 
                color: isUpcoming ? theme.backgroundDark : '#fff',
                fontSize: '10px',
                fontWeight: 'bold',
                fontFamily: 'inherit'
              }}>
                {duration}m
              </Typography>
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
                minWidth: '400px',
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
                {/* Satellite and Ground Station Info */}
                <Box sx={{ padding: 1.5, borderBottom: `1px solid rgba(${theme.primaryRGB}, 0.2)` }}>
                  <Box sx={{ display: 'flex', gap: 2, marginBottom: 1 }}>
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

                {/* Simple Timeline */}
                <Box sx={{ padding: 1 }}>
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