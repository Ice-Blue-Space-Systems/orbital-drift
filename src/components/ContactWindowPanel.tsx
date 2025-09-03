import React, { useState, useRef } from "react";
import { useSelector } from "react-redux";
import { Box, IconButton, Typography } from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  DragIndicator as DragIndicatorIcon,
  Close as CloseIcon,
  Schedule as ScheduleIcon,
} from "@mui/icons-material";
import { RootState } from "../store";
import { useTheme } from "../contexts/ThemeContext";

import { useNextContactWindow } from "../hooks/useNextContactWindow";
import { Satellite, GroundStation } from "../types";

// Simple Satellite Name Component
const SatelliteName: React.FC<{ satelliteId: string | null }> = ({ satelliteId }) => {
  const satellites = useSelector((state: RootState) => state.mongo.satellites);
  const satellite = satellites.find(sat => sat._id === satelliteId);
  return <>{satellite?.name || "Unknown Satellite"}</>;
};

// Simple Ground Station Name Component
const GroundStationName: React.FC<{ groundStationId: string | null }> = ({ groundStationId }) => {
  const groundStations = useSelector((state: RootState) => state.mongo.groundStations);
  const groundStation = groundStations.find(gs => gs._id === groundStationId);
  return <>{groundStation?.name || "Unknown Ground Station"}</>;
};

interface ContactWindowPanelProps {
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  onClose?: () => void;
}

const ContactWindowPanel: React.FC<ContactWindowPanelProps> = ({
  position = "bottom-left",
  onClose
}) => {
  const { theme } = useTheme();
  const [isExpanded, setIsExpanded] = useState(true); // Start expanded by default
  const [isPanelDragging, setIsPanelDragging] = useState(false);
  const [panelPosition, setPanelPosition] = useState({ x: 0, y: 0 });
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const panelRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0, panelX: 0, panelY: 0 });

  // Get required data
  const contactWindows = useSelector((state: RootState) => state.contactWindows.data);
  const selectedSatId = useSelector((state: RootState) => state.mongo.selectedSatId);
  const selectedGroundStationId = useSelector((state: RootState) => state.mongo.selectedGroundStationId);

  // Only show panel if both satellite and ground station are selected
  const shouldShowPanel = selectedSatId && selectedGroundStationId;

  // Use the existing hook to get next contact window
  const { nextContactWindow } = useNextContactWindow({
    contactWindows,
    selectedSatId,
    selectedGroundStationId,
    currentTime,
  });

  // Update current time every second
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Calculate progress for the collapsed bar
  const getProgressData = () => {
    if (!nextContactWindow) return { progress: 0, color: '#666666', timeText: "No upcoming contact" };

    const now = currentTime.getTime();
    const aosTime = new Date(nextContactWindow.scheduledAOS).getTime();
    const losTime = new Date(nextContactWindow.scheduledLOS).getTime();

    // Check if contact is currently active
    if (now >= aosTime && now <= losTime) {
      const totalDuration = losTime - aosTime;
      const elapsed = now - aosTime;
      const progress = (elapsed / totalDuration) * 100;
      const remaining = losTime - now;
      
      return {
        progress: Math.min(100, Math.max(0, progress)),
        color: '#00ff00', // Green for active
        timeText: `ACTIVE: ${formatTimeRemaining(remaining)} remaining`,
        isActive: true
      };
    }

    // Contact is in the future
    const timeUntilContact = aosTime - now;
    if (timeUntilContact <= 0) {
      return { progress: 100, color: '#ff6666', timeText: "Contact overdue", isActive: false };
    }

    // Calculate progress based on 24 hour lookout window
    const lookoutWindow = 24 * 60 * 60 * 1000; // 24 hours
    const progress = Math.max(0, 100 - (timeUntilContact / lookoutWindow) * 100);

    return {
      progress: Math.min(100, Math.max(0, progress)),
      color: theme.primary,
      timeText: formatTimeRemaining(timeUntilContact),
      isActive: false
    };
  };

  const formatTimeRemaining = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const days = Math.floor(totalSeconds / (24 * 3600));
    const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else {
      return `${minutes}m ${seconds}s`;
    }
  };

  // Panel dragging handlers
  const handlePanelMouseDown = (e: React.MouseEvent) => {
    // Only start dragging if clicking on the header/title area, not controls
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[role="button"]')) {
      return;
    }

    e.preventDefault();
    setIsPanelDragging(true);
    
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panelX: panelPosition.x,
      panelY: panelPosition.y
    };

    const handlePanelMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;
      
      setPanelPosition({
        x: dragStartRef.current.panelX + deltaX,
        y: dragStartRef.current.panelY + deltaY
      });
    };

    const handlePanelMouseUp = () => {
      setIsPanelDragging(false);
      document.removeEventListener("mousemove", handlePanelMouseMove);
      document.removeEventListener("mouseup", handlePanelMouseUp);
    };

    document.addEventListener("mousemove", handlePanelMouseMove);
    document.addEventListener("mouseup", handlePanelMouseUp);
  };

  const getPositionStyles = () => {
    const baseStyles = {
      position: "fixed" as const,
      zIndex: 1500,
      cursor: isPanelDragging ? 'grabbing' : 'grab',
      transition: isPanelDragging ? 'none' : 'all 0.2s ease',
    };

    // If panel has been dragged, use custom position with transform
    if (panelPosition.x !== 0 || panelPosition.y !== 0) {
      // Get the initial position and apply the drag offset
      let initialStyles;
      switch (position) {
        case "top-left":
          initialStyles = { top: "20px", left: "20px" };
          break;
        case "top-right":
          initialStyles = { top: "20px", right: "20px" };
          break;
        case "bottom-left":
          initialStyles = { bottom: "20px", left: "20px" };
          break;
        case "bottom-right":
          initialStyles = { bottom: "20px", right: "20px" };
          break;
        default:
          initialStyles = { bottom: "20px", left: "20px" };
      }
      
      return {
        ...baseStyles,
        ...initialStyles,
        transform: `translate(${panelPosition.x}px, ${panelPosition.y}px)`,
      };
    }

    // Otherwise use default position based on position prop
    switch (position) {
      case "top-left":
        return { ...baseStyles, top: "20px", left: "20px" };
      case "top-right":
        return { ...baseStyles, top: "20px", right: "20px" };
      case "bottom-left":
        return { ...baseStyles, bottom: "20px", left: "20px" };
      case "bottom-right":
        return { ...baseStyles, bottom: "20px", right: "20px" };
      default:
        return { ...baseStyles, bottom: "20px", left: "20px" };
    }
  };

  if (!shouldShowPanel) {
    return null;
  }

  return (
    <Box sx={{ ...getPositionStyles() }} ref={panelRef}>
      {/* Main Panel */}
      <Box
        onMouseDown={handlePanelMouseDown}
        sx={{
          background: theme.background,
          backdropFilter: 'blur(20px)',
          border: `1px solid ${theme.borderGradient}`,
          borderRadius: '20px',
          boxShadow: isExpanded 
            ? `0 25px 80px ${theme.glowColor}, inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 40px ${theme.glowColor}`
            : `0 16px 50px ${theme.glowColor}, inset 0 1px 0 rgba(255, 255, 255, 0.1)`,
          padding: isExpanded ? 2 : '12px 16px',
          minWidth: isExpanded ? '320px' : '220px',
          minHeight: isExpanded ? 'auto' : '40px',
          maxHeight: isExpanded ? '300px' : '40px',
          overflow: isExpanded ? 'hidden' : 'visible',
          fontFamily: "'Courier New', Courier, monospace",
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isExpanded ? 'scale(1.02)' : 'scale(1)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: isExpanded ? 'flex-start' : 'center',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: '20px',
            padding: '1px',
            background: theme.backgroundGradient,
            mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            maskComposite: 'exclude',
            opacity: isExpanded ? 1 : 0,
            transition: 'opacity 0.4s ease',
          },
        }}
      >
        {/* Header - only show when expanded */}
        {isExpanded && (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: 2,
            padding: '8px 4px',
            minHeight: '32px',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <DragIndicatorIcon 
                sx={{ 
                  color: theme.textSecondary, 
                  fontSize: 16,
                  cursor: 'grab',
                  opacity: 0.7,
                  '&:hover': {
                    opacity: 1,
                    color: theme.primary,
                  }
                }} 
              />
              
              <ScheduleIcon sx={{ color: theme.primary, fontSize: 18 }} />
              
              {/* Panel Title */}
              <Typography 
                variant="body2" 
                sx={{ 
                  color: theme.primary,
                  fontFamily: 'inherit',
                  fontWeight: 'bold',
                  fontSize: '0.8rem',
                  letterSpacing: '0.5px',
                }}
              >
                NEXT CONTACT
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {/* Expand/Collapse Toggle */}
              <IconButton
                onClick={() => setIsExpanded(!isExpanded)}
                sx={{
                  color: theme.primary,
                  padding: '4px',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: `rgba(${theme.primaryRGB}, 0.1)`,
                    transform: 'scale(1.1)',
                  },
                }}
              >
                {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
              
              {/* Close Button */}
              <IconButton
                onClick={onClose}
                sx={{
                  color: theme.textSecondary,
                  padding: '4px',
                  transition: 'all 0.2s ease',
                  opacity: 0.7,
                  '&:hover': {
                    opacity: 1,
                    color: '#ff6666',
                    backgroundColor: 'rgba(255, 102, 102, 0.1)',
                    transform: 'scale(1.1)',
                  },
                }}
              >
                <CloseIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>
          </Box>
        )}

        {/* Collapsed state - show just "Next Contact" text with controls */}
        {!isExpanded && (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            width: '100%',
            gap: 1,
            padding: '4px 8px',
          }}>
            {/* Simple text */}
            <Typography variant="body2" sx={{ 
              color: theme.primary,
              fontFamily: 'inherit',
              fontWeight: 'bold',
              fontSize: '0.8rem',
              letterSpacing: '0.5px',
            }}>
              Next Contact
            </Typography>
            
            {/* Controls */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
              {/* Expand Arrow */}
              <IconButton
                onClick={() => setIsExpanded(!isExpanded)}
                sx={{
                  color: theme.primary,
                  padding: '4px',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: `rgba(${theme.primaryRGB}, 0.1)`,
                    transform: 'scale(1.1)',
                  },
                }}
              >
                <ExpandMoreIcon sx={{ fontSize: 16 }} />
              </IconButton>
              
              {/* Close Button */}
              <IconButton
                onClick={onClose}
                sx={{
                  color: theme.textSecondary,
                  padding: '4px',
                  transition: 'all 0.2s ease',
                  opacity: 0.7,
                  '&:hover': {
                    opacity: 1,
                    color: '#ff6666',
                    backgroundColor: 'rgba(255, 102, 102, 0.1)',
                    transform: 'scale(1.1)',
                  },
                }}
              >
                <CloseIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>
          </Box>
        )}

        {/* Expanded Content - Simple text info */}
        {isExpanded && (
          <Box sx={{ 
            animation: 'slideDown 0.3s ease',
            '@keyframes slideDown': {
              from: { opacity: 0, transform: 'translateY(-10px)' },
              to: { opacity: 1, transform: 'translateY(0)' },
            },
          }}>
            {/* Progress Bar - Direct Implementation */}
            <Box sx={{ marginBottom: 2 }}>
              {nextContactWindow && (
                <>
                  {/* Progress Bar */}
                  <Box sx={{
                    width: '100%',
                    height: '6px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '3px',
                    overflow: 'hidden',
                    position: 'relative',
                    marginBottom: 1,
                  }}>
                    <Box sx={{
                      width: `${getProgressData().progress}%`,
                      height: '100%',
                      backgroundColor: getProgressData().color,
                      borderRadius: '3px',
                      boxShadow: `0 0 10px ${getProgressData().color}80`,
                      transition: 'width 0.5s ease, background-color 0.3s ease',
                    }} />
                  </Box>
                  
                  {/* Time Display */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="caption" sx={{ 
                      color: getProgressData().color, 
                      fontFamily: 'inherit',
                      fontSize: '0.7rem',
                      fontWeight: 'bold',
                    }}>
                      {getProgressData().timeText}
                    </Typography>
                    
                    <Typography variant="caption" sx={{ 
                      color: getProgressData().color, 
                      fontFamily: 'inherit', 
                      fontWeight: 'bold',
                      fontSize: '0.7rem'
                    }}>
                      {Math.round(getProgressData().progress)}%
                    </Typography>
                  </Box>
                </>
              )}
            </Box>

            {/* Simple Text Information */}
            {nextContactWindow && (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 1,
                fontSize: '0.8rem',
              }}>
                {/* Satellite Name */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ 
                    color: theme.textSecondary, 
                    fontFamily: 'inherit',
                    fontSize: '0.8rem',
                  }}>
                    Satellite:
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: theme.textPrimary, 
                    fontFamily: 'inherit',
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                  }}>
                    <SatelliteName satelliteId={selectedSatId} />
                  </Typography>
                </Box>

                {/* Ground Station Name */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ 
                    color: theme.textSecondary, 
                    fontFamily: 'inherit',
                    fontSize: '0.8rem',
                  }}>
                    Ground Station:
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: theme.textPrimary, 
                    fontFamily: 'inherit',
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                  }}>
                    <GroundStationName groundStationId={selectedGroundStationId} />
                  </Typography>
                </Box>

                {/* Window Time */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ 
                    color: theme.textSecondary, 
                    fontFamily: 'inherit',
                    fontSize: '0.8rem',
                  }}>
                    AOS Time:
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: theme.textPrimary, 
                    fontFamily: 'inherit',
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                  }}>
                    {new Date(nextContactWindow.scheduledAOS).toLocaleTimeString()}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ 
                    color: theme.textSecondary, 
                    fontFamily: 'inherit',
                    fontSize: '0.8rem',
                  }}>
                    Duration:
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: theme.primary, 
                    fontFamily: 'inherit',
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                  }}>
                    {Math.round(nextContactWindow.durationSeconds / 60)} minutes
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ContactWindowPanel;
