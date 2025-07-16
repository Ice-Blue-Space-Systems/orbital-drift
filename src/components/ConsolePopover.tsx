import React, { useState, useEffect } from "react";
import { 
  IconButton, 
  Popover, 
  Box, 
  Typography,
  Paper,
  Chip,
  Tooltip,
  Badge,
  LinearProgress,
} from "@mui/material";
import CodeIcon from "@mui/icons-material/Code";
import MonitorIcon from "@mui/icons-material/Monitor";
import SignalCellularAltIcon from "@mui/icons-material/SignalCellularAlt";
import SatelliteIcon from "@mui/icons-material/Satellite";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import RadioIcon from "@mui/icons-material/Radio";
import TerminalIcon from "@mui/icons-material/Terminal";
import SatelliteStatusTable from "./SatelliteStatusTable";
import { useSelector } from "react-redux";
import { RootState } from "../store";
import { getDisplayGroundStations } from "../utils/groundStationDataUtils";

interface ConsolePopoverProps {
  debugInfo: any;
  nextContactWindow: any;
}

const ConsolePopover: React.FC<ConsolePopoverProps> = ({
  debugInfo,
  nextContactWindow,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const selectedSatId = useSelector((state: RootState) => state.mongo.selectedSatId);
  const selectedGroundStationId = useSelector(
    (state: RootState) => state.mongo.selectedGroundStationId
  );
  const { satellites, groundStations } = useSelector((state: RootState) => state.mongo);

  // Get display ground stations (which includes proper ID formatting)
  const displayGroundStations = getDisplayGroundStations(groundStations);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  // Get current satellite and ground station info
  const currentSatellite = satellites.find((sat: any) => sat._id === selectedSatId);
  const currentGroundStation = displayGroundStations.find((gs: any) => gs.id === selectedGroundStationId);

  // Calculate status indicators
  const hasActiveConnection = debugInfo?.inSight || false;
  const hasSelection = !!(selectedSatId && selectedGroundStationId);
  
  // Get signal quality based on elevation
  const getSignalQuality = () => {
    if (!debugInfo?.elevation) return 0;
    const elevation = Math.abs(debugInfo.elevation);
    if (elevation >= 60) return 100;
    if (elevation >= 30) return 75;
    if (elevation >= 10) return 50;
    return 25;
  };

  const getStatusColor = () => {
    if (hasActiveConnection) return "#00ff41";
    if (hasSelection) return "#ffaa00";
    return "#666";
  };

  const getStatusText = () => {
    if (hasActiveConnection) return "LIVE TRACKING";
    if (hasSelection) return "MONITORING";
    return "STANDBY";
  };

  const getBadgeContent = () => {
    if (hasActiveConnection) return "LIVE";
    if (hasSelection) return "RDY";
    return 0;
  };

  // Helper function to calculate time remaining
  const getTimeRemaining = () => {
    if (!nextContactWindow) return null;
    
    const now = currentTime.getTime();
    let targetTime;
    let isActive = false;
    
    if (hasActiveConnection) {
      // If we have an active connection, show time until LOS
      targetTime = new Date(nextContactWindow.scheduledLOS).getTime();
      isActive = true;
    } else {
      // Show time until next AOS
      targetTime = new Date(nextContactWindow.scheduledAOS).getTime();
    }
    
    const timeDiff = targetTime - now;
    
    if (timeDiff <= 0) return null;
    
    const minutes = Math.floor(timeDiff / (1000 * 60));
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
    
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return { 
        display: `${hours}h ${remainingMinutes}m`, 
        isActive,
        totalMinutes: minutes 
      };
    } else if (minutes > 0) {
      return { 
        display: `${minutes}m ${seconds}s`, 
        isActive,
        totalMinutes: minutes 
      };
    } else {
      return { 
        display: `${seconds}s`, 
        isActive,
        totalMinutes: 0 
      };
    }
  };

  const timeRemaining = getTimeRemaining();

  return (
    <>
      <Tooltip 
        title={
          hasActiveConnection 
            ? "Live satellite tracking data available" 
            : hasSelection 
              ? "Satellite and ground station selected - monitoring" 
              : "Select satellite and ground station to view telemetry"
        }
        arrow
      >
        <Badge 
          badgeContent={getBadgeContent()}
          color={hasActiveConnection ? "success" : "warning"}
          variant={hasActiveConnection ? "standard" : "dot"}
          invisible={!hasActiveConnection && !hasSelection}
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
              animation: hasActiveConnection ? "pulse 2s infinite" : "none",
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
            {hasActiveConnection ? <MonitorIcon /> : hasSelection ? <TerminalIcon /> : <CodeIcon />}
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
            width: '680px',
            maxHeight: '750px',
            backgroundColor: 'rgba(10, 10, 10, 0.95)',
            backdropFilter: 'blur(15px)',
            border: '1px solid #00ff41',
            borderRadius: '16px',
            boxShadow: '0 12px 40px rgba(0, 255, 65, 0.25)',
            fontFamily: "'Courier New', Courier, monospace",
            overflow: 'hidden',
          }
        }}
      >
        <Paper 
          elevation={0}
          sx={{ 
            backgroundColor: 'transparent',
            padding: 0,
            color: '#00ff41',
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Header Section */}
          <Box sx={{ 
            padding: 3, 
            borderBottom: '1px solid rgba(0, 255, 65, 0.3)',
            background: 'linear-gradient(135deg, rgba(0, 255, 65, 0.15) 0%, rgba(0, 255, 65, 0.05) 100%)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Animated background effect */}
            <Box sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(circle at 30% 30%, rgba(0, 255, 65, 0.1) 0%, transparent 50%)',
              animation: 'glow 4s ease-in-out infinite alternate',
              '@keyframes glow': {
                '0%': { opacity: 0.5 },
                '100%': { opacity: 1 },
              },
            }} />
            
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    color: '#00ff41', 
                    fontFamily: 'inherit',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    textShadow: '0 0 10px rgba(0, 255, 65, 0.5)',
                  }}
                >
                  <TerminalIcon /> MISSION TELEMETRY
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {hasActiveConnection && (
                    <Chip 
                      label="LIVE DATA" 
                      icon={<SignalCellularAltIcon />}
                      size="small"
                      sx={{
                        backgroundColor: '#00ff41',
                        color: '#000',
                        fontWeight: 'bold',
                        animation: 'pulse 2s infinite',
                        boxShadow: '0 0 10px rgba(0, 255, 65, 0.5)',
                      }}
                    />
                  )}
                  <Chip 
                    label={getStatusText()} 
                    size="small"
                    sx={{
                      backgroundColor: getStatusColor(),
                      color: hasActiveConnection ? '#000' : '#fff',
                      fontWeight: 'bold',
                    }}
                  />
                </Box>
              </Box>
              
              {/* Asset Information */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SatelliteIcon sx={{ color: '#00aaff', fontSize: 16 }} />
                    <Typography variant="body2" sx={{ color: '#aaa', fontFamily: 'inherit' }}>
                      TARGET:
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ color: '#00ff41', fontFamily: 'inherit', fontWeight: 'bold' }}>
                    {currentSatellite?.name || "NO SATELLITE SELECTED"}
                  </Typography>
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationOnIcon sx={{ color: '#ff6600', fontSize: 16 }} />
                    <Typography variant="body2" sx={{ color: '#aaa', fontFamily: 'inherit' }}>
                      OBSERVER:
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ color: '#00ff41', fontFamily: 'inherit', fontWeight: 'bold' }}>
                    {currentGroundStation?.name || "NO STATION SELECTED"}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Real-time Dashboard */}
          {hasSelection && (
            <Box sx={{ 
              padding: 2, 
              borderBottom: '1px solid rgba(0, 255, 65, 0.2)',
              backgroundColor: 'rgba(0, 0, 0, 0.2)'
            }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2 }}>
                {/* Signal Strength */}
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#666', fontFamily: 'inherit' }}>
                    SIGNAL
                  </Typography>
                  <Typography variant="h4" sx={{ 
                    color: getSignalQuality() > 75 ? '#00ff41' : getSignalQuality() > 50 ? '#ffaa00' : '#ff4444', 
                    fontFamily: 'inherit', 
                    lineHeight: 1,
                    fontWeight: 'bold'
                  }}>
                    {hasActiveConnection ? getSignalQuality() : '--'}%
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={hasActiveConnection ? getSignalQuality() : 0} 
                    sx={{
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: getSignalQuality() > 75 ? '#00ff41' : getSignalQuality() > 50 ? '#ffaa00' : '#ff4444',
                      },
                    }}
                  />
                </Box>

                {/* Elevation */}
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#666', fontFamily: 'inherit' }}>
                    ELEVATION
                  </Typography>
                  <Typography variant="h4" sx={{ color: '#00aaff', fontFamily: 'inherit', lineHeight: 1, fontWeight: 'bold' }}>
                    {debugInfo?.elevation ? `${Math.abs(debugInfo.elevation).toFixed(1)}°` : '--'}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0.5 }}>
                    <TrendingUpIcon sx={{ color: '#00aaff', fontSize: 12 }} />
                    <Typography variant="caption" sx={{ color: '#00aaff', fontFamily: 'inherit' }}>
                      {debugInfo?.elevation ? (debugInfo.elevation > 0 ? 'RISING' : 'SETTING') : '--'}
                    </Typography>
                  </Box>
                </Box>

                {/* Range */}
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#666', fontFamily: 'inherit' }}>
                    RANGE
                  </Typography>
                  <Typography variant="h4" sx={{ color: '#ff6600', fontFamily: 'inherit', lineHeight: 1, fontWeight: 'bold' }}>
                    {(() => {
                      if (!debugInfo?.satellitePosition || !debugInfo?.groundStationPosition) return '--';
                      const satPos = debugInfo.satellitePosition;
                      const gsPos = debugInfo.groundStationPosition;
                      const distance = Math.sqrt(
                        Math.pow(satPos.x - gsPos.x, 2) + 
                        Math.pow(satPos.y - gsPos.y, 2) + 
                        Math.pow(satPos.z - gsPos.z, 2)
                      ) / 1000;
                      return distance.toFixed(0);
                    })()}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#ff6600', fontFamily: 'inherit' }}>
                    KILOMETERS
                  </Typography>
                </Box>

                {/* Contact Timer */}
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#666', fontFamily: 'inherit' }}>
                    {hasActiveConnection ? 'CONTACT TIME' : 'NEXT AOS'}
                  </Typography>
                  <Typography variant="h4" sx={{ 
                    color: timeRemaining ? (timeRemaining.totalMinutes <= 5 ? '#ff4444' : '#ffaa00') : '#666', 
                    fontFamily: 'inherit', 
                    lineHeight: 1, 
                    fontWeight: 'bold',
                    animation: timeRemaining && timeRemaining.totalMinutes <= 5 ? 'urgentPulse 1s infinite' : 'none',
                    '@keyframes urgentPulse': {
                      '0%, 100%': { opacity: 1 },
                      '50%': { opacity: 0.7 },
                    },
                  }}>
                    {timeRemaining ? timeRemaining.display : '--'}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0.5 }}>
                    <AccessTimeIcon sx={{ 
                      color: timeRemaining ? (timeRemaining.totalMinutes <= 5 ? '#ff4444' : '#ffaa00') : '#666', 
                      fontSize: 12 
                    }} />
                    <Typography variant="caption" sx={{ 
                      color: timeRemaining ? (timeRemaining.totalMinutes <= 5 ? '#ff4444' : '#ffaa00') : '#666', 
                      fontFamily: 'inherit' 
                    }}>
                      {hasActiveConnection ? 'REMAINING' : 'TO CONTACT'}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          )}

          {/* System Status Bar */}
          <Box sx={{ 
            padding: 1.5, 
            borderBottom: '1px solid rgba(0, 255, 65, 0.2)',
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Box sx={{ display: 'flex', gap: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ 
                  width: 8, 
                  height: 8, 
                  borderRadius: '50%', 
                  backgroundColor: hasSelection ? '#00ff41' : '#666',
                  animation: hasActiveConnection ? 'pulse 2s infinite' : 'none'
                }} />
                <Typography variant="caption" sx={{ color: '#aaa', fontFamily: 'inherit' }}>
                  SYSTEM: {hasSelection ? 'TRACKING' : 'IDLE'}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <RadioIcon sx={{ color: hasActiveConnection ? '#00ff41' : '#666', fontSize: 14 }} />
                <Typography variant="caption" sx={{ color: '#aaa', fontFamily: 'inherit' }}>
                  RF: {hasActiveConnection ? 'ACTIVE' : 'STANDBY'}
                </Typography>
              </Box>
            </Box>
            
            <Typography variant="caption" sx={{ color: '#666', fontFamily: 'inherit' }}>
              {currentTime.toLocaleTimeString()} UTC
            </Typography>
          </Box>

          {/* Detailed Telemetry Data */}
          <Box sx={{ flex: 1, overflow: 'auto', backgroundColor: 'rgba(0, 0, 0, 0.05)' }}>
            {hasSelection ? (
              <SatelliteStatusTable 
                debugInfo={debugInfo}
                nextContactWindow={nextContactWindow}
              />
            ) : (
              <Box sx={{ 
                padding: 4, 
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '200px'
              }}>
                <TerminalIcon sx={{ color: '#666', fontSize: 64, mb: 2 }} />
                <Typography variant="h6" sx={{ color: '#666', fontFamily: 'inherit', mb: 1 }}>
                  NO TELEMETRY DATA
                </Typography>
                <Typography variant="body2" sx={{ color: '#888', fontFamily: 'inherit', textAlign: 'center' }}>
                  Select a satellite and ground station to view<br />
                  real-time tracking telemetry and orbital data
                </Typography>
                <Box sx={{ 
                  mt: 3, 
                  padding: 2, 
                  backgroundColor: 'rgba(0, 255, 65, 0.05)',
                  border: '1px solid rgba(0, 255, 65, 0.2)',
                  borderRadius: 2,
                  maxWidth: '400px'
                }}>
                  <Typography variant="caption" sx={{ color: '#00ff41', fontFamily: 'inherit' }}>
                    💡 TIP: Click on any satellite and ground station marker in the 3D view to start tracking
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>

          {/* Footer Status */}
          <Box sx={{ 
            padding: 1.5, 
            borderTop: '1px solid rgba(0, 255, 65, 0.2)',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Typography variant="caption" sx={{ color: '#666', fontFamily: 'inherit' }}>
              MISSION CONTROL CONSOLE v2.1.0
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Typography variant="caption" sx={{ color: '#666', fontFamily: 'inherit' }}>
                ASSETS: {satellites.length} SAT | {displayGroundStations.length} GS
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Popover>
    </>
  );
};

export default ConsolePopover;