import React, { useState, useEffect } from "react";
import { Box, Typography, IconButton, Tooltip, Chip, Collapse } from "@mui/material";
import { Refresh as RefreshIcon, Close as CloseIcon, Schedule as ScheduleIcon } from "@mui/icons-material";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../store";
import { useTheme } from "../contexts/ThemeContext";
import { useNextContactWindow } from "../hooks/useNextContactWindow";
import { refreshContactWindows } from "../store/contactWindowsSlice";
import { ContactWindow } from "../types";

interface ContactWindowCountdownProps {
  compact?: boolean;
  showRefreshButton?: boolean;
  closable?: boolean;
}

const ContactWindowCountdown: React.FC<ContactWindowCountdownProps> = ({
  compact = false,
  showRefreshButton = true,
  closable = false,
}) => {
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const [isVisible, setIsVisible] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Get required data from Redux
  const contactWindows = useSelector((state: RootState) => state.contactWindows.data);
  const selectedSatId = useSelector((state: RootState) => state.mongo.selectedSatId);
  const selectedGroundStationId = useSelector((state: RootState) => state.mongo.selectedGroundStationId);
  const isLoading = useSelector((state: RootState) => state.contactWindows.status === 'loading');

  // Use the existing hook to get next contact window
  const { nextContactWindow, nextAosLosLabel } = useNextContactWindow({
    contactWindows,
    selectedSatId,
    selectedGroundStationId,
    currentTime,
  });

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Calculate time until next contact and progress
  const getContactProgress = () => {
    if (!nextContactWindow) return { timeRemaining: "No upcoming contact", progress: 0, isActive: false };

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
        timeRemaining: formatTimeRemaining(remaining),
        progress: Math.min(100, Math.max(0, progress)),
        isActive: true,
        status: "ACTIVE CONTACT"
      };
    }

    // Contact is in the future
    const timeUntilContact = aosTime - now;
    if (timeUntilContact <= 0) {
      return { timeRemaining: "Contact overdue", progress: 100, isActive: false };
    }

    // Calculate progress based on a reasonable lookout window (24 hours)
    const lookoutWindow = 24 * 60 * 60 * 1000; // 24 hours in ms
    const progress = Math.max(0, 100 - (timeUntilContact / lookoutWindow) * 100);

    return {
      timeRemaining: formatTimeRemaining(timeUntilContact),
      progress: Math.min(100, Math.max(0, progress)),
      isActive: false,
      status: "NEXT CONTACT"
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
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const handleRefresh = () => {
    if (selectedSatId && selectedGroundStationId) {
      dispatch(refreshContactWindows({ satelliteId: selectedSatId, groundStationId: selectedGroundStationId }) as any);
    }
  };

  const contactProgress = getContactProgress();
  const progressColor = contactProgress.isActive ? '#00ff00' : theme.primary;

  // Don't show if no satellite or ground station selected
  if (!selectedSatId || !selectedGroundStationId) {
    return null;
  }

  if (!isVisible && closable) {
    return null;
  }

  return (
    <Collapse in={isVisible}>
      <Box sx={{ 
        marginTop: compact ? 1 : 2,
        padding: compact ? 1 : 1.5,
        backgroundColor: `${progressColor}10`,
        borderRadius: '8px',
        border: `1px solid ${progressColor}30`,
        position: 'relative',
      }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <ScheduleIcon sx={{ 
              color: progressColor, 
              fontSize: compact ? 12 : 14,
              animation: contactProgress.isActive ? 'pulse 2s infinite' : 'none',
              '@keyframes pulse': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.6 },
              },
            }} />
            <Typography variant="caption" sx={{ 
              color: progressColor, 
              fontFamily: 'inherit', 
              fontWeight: 'bold',
              fontSize: compact ? '0.6rem' : '0.7rem'
            }}>
              {contactProgress.status || "NEXT CONTACT"}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {/* Progress Percentage */}
            <Typography variant="caption" sx={{ 
              color: progressColor, 
              fontFamily: 'inherit', 
              fontWeight: 'bold',
              fontSize: compact ? '0.6rem' : '0.7rem'
            }}>
              {Math.round(contactProgress.progress)}%
            </Typography>
            
            {/* Refresh Button */}
            {showRefreshButton && (
              <Tooltip title="Refresh Contact Windows" arrow>
                <IconButton
                  size="small"
                  onClick={handleRefresh}
                  disabled={isLoading}
                  sx={{
                    color: progressColor,
                    padding: '2px',
                    opacity: isLoading ? 0.5 : 0.7,
                    '&:hover': {
                      opacity: 1,
                      backgroundColor: `${progressColor}20`,
                    },
                  }}
                >
                  <RefreshIcon sx={{ 
                    fontSize: compact ? 12 : 14,
                    animation: isLoading ? 'spin 1s linear infinite' : 'none',
                    '@keyframes spin': {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(360deg)' },
                    },
                  }} />
                </IconButton>
              </Tooltip>
            )}
            
            {/* Close Button */}
            {closable && (
              <Tooltip title="Hide Contact Countdown" arrow>
                <IconButton
                  size="small"
                  onClick={() => setIsVisible(false)}
                  sx={{
                    color: progressColor,
                    padding: '2px',
                    opacity: 0.7,
                    '&:hover': {
                      opacity: 1,
                      backgroundColor: `${progressColor}20`,
                    },
                  }}
                >
                  <CloseIcon sx={{ fontSize: compact ? 12 : 14 }} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>
        
        {/* Progress Bar */}
        <Box sx={{
          width: '100%',
          height: compact ? '4px' : '6px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '3px',
          overflow: 'hidden',
          position: 'relative',
          marginBottom: 1,
        }}>
          <Box sx={{
            width: `${contactProgress.progress}%`,
            height: '100%',
            backgroundColor: progressColor,
            borderRadius: '3px',
            boxShadow: `0 0 10px ${progressColor}80`,
            transition: 'width 0.5s ease, background-color 0.3s ease',
          }} />
        </Box>
        
        {/* Time Display */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="caption" sx={{ 
            color: progressColor, 
            fontFamily: 'inherit',
            fontSize: compact ? '0.6rem' : '0.7rem',
            fontWeight: 'bold',
          }}>
            {contactProgress.timeRemaining}
          </Typography>
          
          {nextContactWindow && (
            <Chip
              label={contactProgress.isActive ? "LIVE" : "SCHEDULED"}
              size="small"
              sx={{
                backgroundColor: contactProgress.isActive ? 'rgba(0, 255, 0, 0.3)' : `${progressColor}20`,
                color: contactProgress.isActive ? '#00ff00' : progressColor,
                fontFamily: 'inherit',
                fontSize: compact ? '0.5rem' : '0.55rem',
                height: compact ? '16px' : '18px',
                fontWeight: 'bold',
                border: `1px solid ${contactProgress.isActive ? 'rgba(0, 255, 0, 0.5)' : `${progressColor}60`}`,
                boxShadow: `0 0 8px ${contactProgress.isActive ? 'rgba(0, 255, 0, 0.4)' : `${progressColor}40`}`,
              }}
            />
          )}
        </Box>
      </Box>
    </Collapse>
  );
};

export default ContactWindowCountdown;
