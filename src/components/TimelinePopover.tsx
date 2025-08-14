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
import { DataSet } from "vis-data";
import { Timeline } from "vis-timeline/standalone";
import "vis-timeline/styles/vis-timeline-graph2d.min.css";
import { transformContactWindowsToTimelineItems } from "../utils/timelineUtils";

const TimelinePopover: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const { theme } = useTheme();
  const navigate = useNavigate();
  const timelineRef = useRef<HTMLDivElement>(null);
  const timelineInstance = useRef<Timeline | null>(null);
  
  const {
    selectedSatelliteId,
    selectedGroundStationId,
    selectedSatellite,
    selectedGroundStation,
    satellites,
    groundStations,
  } = useSelectedEntities();
  
  const contactWindows = useSelector(selectContactWindows);
  const cesiumClockTime = useSelector((state: any) => state.cesiumClock.utc);
  
  const open = Boolean(anchorEl);
  
  // Calculate upcoming contact windows
  const upcomingWindows = contactWindows.filter((window: any) => {
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

  // Initialize mini timeline when popover opens
  useEffect(() => {
    if (!open || !timelineRef.current) return;

    console.log('TimelinePopover: Initializing timeline', {
      selectedSatelliteId,
      selectedGroundStationId,
      contactWindowsCount: contactWindows.length,
      satellitesCount: satellites.length,
      groundStationsCount: groundStations.length
    });

    // Clear any existing timeline with error handling
    if (timelineInstance.current) {
      try {
        timelineInstance.current.destroy();
        timelineInstance.current = null;
      } catch (error) {
        console.warn('Timeline cleanup error in popover:', error);
      }
    }

    // Debounce timeline creation to prevent rapid recreation
    const timeoutId = setTimeout(() => {
      try {
        // Always try to create the timeline if we have satellite and ground station data
        if (satellites.length > 0 && groundStations.length > 0 && timelineRef.current) {
          // Create timeline items (will be empty for predefined ground stations)
          const timelineData = transformContactWindowsToTimelineItems(
            contactWindows,
            satellites,
            groundStations
          );

          console.log('TimelinePopover: Timeline data created', {
            itemsCount: timelineData.items.length,
            groupsCount: timelineData.groups.length
          });

          const items = new DataSet(timelineData.items);
          const groups = new DataSet(timelineData.groups);
          const now = cesiumClockTime || new Date();
          
          // Calculate time range for mini view (next 24 hours)
          const start = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 hours before
          const end = new Date(now.getTime() + 22 * 60 * 60 * 1000); // 22 hours after

          const options = {
            width: '100%',
            height: '120px',
            start: start,
            end: end,
            zoomable: false,
            moveable: false,
            showCurrentTime: true,
            currentTime: now,
            orientation: { axis: 'top' },
            margin: {
              item: 2,
              axis: 5
            },
            template: (item: any) => {
              const duration = Math.round(item.durationSeconds / 60);
              return `<div style="font-size: 10px; padding: 1px 3px;">${duration}m</div>`;
            }
          };

          timelineInstance.current = new Timeline(timelineRef.current, items, options);
          
          // Set groups if available
          if (timelineData.groups.length > 0) {
            timelineInstance.current.setGroups(groups as any);
          }

          console.log('TimelinePopover: Timeline created successfully');
        }
      } catch (error) {
        console.error('Error creating mini timeline:', error);
      }
    }, 150); // 150ms debounce

    // Cleanup function
    return () => {
      clearTimeout(timeoutId);
      if (timelineInstance.current) {
        try {
          timelineInstance.current.destroy();
          timelineInstance.current = null;
        } catch (error) {
          console.warn('Timeline cleanup error in popover:', error);
        }
      }
    };
  }, [open, contactWindows, selectedSatelliteId, selectedGroundStationId, cesiumClockTime, satellites, groundStations]);

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

  return (
    <>
      <Tooltip title={getTooltipText()} arrow>
        <IconButton
          onClick={handleClick}
          className="icon-button"
          sx={{
            color: getStatusColor(),
            borderRadius: "8px",
            border: `1px solid ${getStatusColor()}`,
            backgroundColor: "rgba(0, 0, 0, 0.3)",
            backdropFilter: "blur(10px)",
            "-webkit-backdrop-filter": "blur(10px)",
            transition: "all 0.2s ease",
            "&:hover": {
              backgroundColor: "rgba(0, 0, 0, 0.6)",
              borderColor: `rgba(${theme.primaryRGB}, 0.4)`,
              boxShadow: `0 8px 25px rgba(${theme.primaryRGB}, 0.2)`,
            },
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
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Typography variant="body2" sx={{ color: '#aaa', fontFamily: 'inherit' }}>
                      SAT: {selectedSatellite?.name || selectedSatelliteId}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#aaa', fontFamily: 'inherit' }}>
                      GS: {selectedGroundStation?.name || selectedGroundStationId}
                    </Typography>
                  </Box>
                </Box>

                {/* Mini Timeline */}
                <Box sx={{ 
                  padding: 1,
                  minHeight: '140px',
                  '& .vis-timeline': {
                    border: 'none',
                    backgroundColor: 'transparent',
                  },
                  '& .vis-item': {
                    backgroundColor: theme.primary,
                    border: 'none',
                    borderRadius: '4px',
                    color: theme.backgroundDark,
                  },
                  '& .vis-time-axis': {
                    color: '#888',
                  },
                  '& .vis-current-time': {
                    backgroundColor: theme.accent,
                  }
                }}>
                  <div ref={timelineRef} style={{ width: '100%', height: '120px' }} />
                  {contactWindows.length === 0 && selectedSatelliteId && selectedGroundStationId && (
                    <Box sx={{ 
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      color: '#666',
                      textAlign: 'center',
                      pointerEvents: 'none',
                      fontSize: '12px'
                    }}>
                      {selectedGroundStationId.startsWith('predefined-') 
                        ? 'No stored contact windows for predefined ground station'
                        : 'No contact windows available for this pair'
                      }
                    </Box>
                  )}
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
