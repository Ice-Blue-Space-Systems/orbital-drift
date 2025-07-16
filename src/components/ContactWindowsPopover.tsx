import React, { useState, useRef } from "react";
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
import ContactWindows from "./ContactWindows";
import { useSelector } from "react-redux";
import { selectContactWindows, selectContactWindowsStatus } from "../store/contactWindowsSlice";

interface ContactWindowsPopoverProps {
  satelliteId: string;
  groundStationId: string;
  satelliteName?: string;
  groundStationName?: string;
  showPlaceholder?: boolean;
}

const ContactWindowsPopover: React.FC<ContactWindowsPopoverProps> = ({
  satelliteId,
  groundStationId,
  satelliteName = "Unknown Satellite",
  groundStationName = "Unknown Ground Station",
  showPlaceholder = false,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const contactWindows = useSelector(selectContactWindows);
  const status = useSelector(selectContactWindowsStatus);
  
  const open = Boolean(anchorEl);
  
  // Calculate stats
  const upcomingWindows = contactWindows.filter((window: any) => 
    new Date(window.scheduledAOS) > new Date()
  ).length;
  
  const activeWindow = contactWindows.find((window: any) => {
    const now = new Date();
    return new Date(window.scheduledAOS) <= now && new Date(window.scheduledLOS) >= now;
  });

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const getStatusColor = () => {
    if (showPlaceholder) return "#666"; // Placeholder state - gray
    if (activeWindow) return "#00ff41"; // Active contact - bright green
    if (upcomingWindows > 0) return "#ffaa00"; // Upcoming contacts - orange
    return "#666"; // No contacts - gray
  };

  const getStatusIcon = () => {
    if (activeWindow && !showPlaceholder) return <SignalCellularAltIcon sx={{ color: "#00ff41" }} />;
    return <EventIcon />;
  };

  const getTooltipText = () => {
    if (showPlaceholder) {
      return "Select a satellite and ground station to view contact windows";
    }
    if (activeWindow) return "Contact Window Active";
    if (upcomingWindows > 0) return `${upcomingWindows} Upcoming Contact${upcomingWindows !== 1 ? 's' : ''}`;
    return "No Upcoming Contacts";
  };

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
            width: '520px',
            maxHeight: '600px',
            backgroundColor: 'rgba(10, 10, 10, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid #00ff41',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0, 255, 65, 0.2)',
            fontFamily: "'Courier New', Courier, monospace",
          }
        }}
      >
        <Paper 
          elevation={0}
          sx={{ 
            backgroundColor: 'transparent',
            padding: 0,
            color: '#00ff41'
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
                backgroundColor: 'rgba(0, 255, 65, 0.05)',
                border: '1px solid rgba(0, 255, 65, 0.2)',
                borderRadius: '8px',
                width: '100%',
                maxWidth: '300px'
              }}>
                <Typography variant="caption" sx={{ 
                  color: '#00ff41', 
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
                borderBottom: '1px solid rgba(0, 255, 65, 0.3)',
                background: 'linear-gradient(135deg, rgba(0, 255, 65, 0.1) 0%, rgba(0, 255, 65, 0.05) 100%)'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      color: '#00ff41', 
                      fontFamily: 'inherit',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}
                  >
                    <EventIcon /> CONTACT WINDOWS
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {activeWindow && (
                      <Chip 
                        label="LIVE" 
                        size="small"
                        sx={{
                          backgroundColor: '#00ff41',
                          color: '#000',
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
                          backgroundColor: '#ffaa00',
                          color: '#000',
                          fontWeight: 'bold',
                        }}
                      />
                    )}
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Typography variant="body2" sx={{ color: '#aaa', fontFamily: 'inherit' }}>
                    SAT: {satelliteName}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#aaa', fontFamily: 'inherit' }}>
                    GS: {groundStationName}
                  </Typography>
                </Box>
              </Box>

              {/* Status Bar */}
              <Box sx={{ 
                padding: 1.5, 
                borderBottom: '1px solid rgba(0, 255, 65, 0.2)',
                backgroundColor: 'rgba(0, 0, 0, 0.3)'
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#666', fontFamily: 'inherit' }}>
                        UPCOMING
                      </Typography>
                      <Typography variant="h6" sx={{ color: '#00ff41', fontFamily: 'inherit', lineHeight: 1 }}>
                        {upcomingWindows}
                      </Typography>
                    </Box>
                    <Divider orientation="vertical" flexItem sx={{ borderColor: '#333' }} />
                    <Box>
                      <Typography variant="caption" sx={{ color: '#666', fontFamily: 'inherit' }}>
                        TOTAL TODAY
                      </Typography>
                      <Typography variant="h6" sx={{ color: '#00ff41', fontFamily: 'inherit', lineHeight: 1 }}>
                        {contactWindows.filter((w: any) => {
                          const windowDate = new Date(w.scheduledAOS).toDateString();
                          const today = new Date().toDateString();
                          return windowDate === today;
                        }).length}
                      </Typography>
                    </Box>
                    <Divider orientation="vertical" flexItem sx={{ borderColor: '#333' }} />
                    <Box>
                      <Typography variant="caption" sx={{ color: '#666', fontFamily: 'inherit' }}>
                        STATUS
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        color: activeWindow ? '#00ff41' : '#666', 
                        fontFamily: 'inherit', 
                        lineHeight: 1,
                        fontWeight: 'bold'
                      }}>
                        {activeWindow ? 'IN CONTACT' : 'STANDBY'}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Typography variant="caption" sx={{ color: '#666', fontFamily: 'inherit' }}>
                    {new Date().toLocaleTimeString()}
                  </Typography>
                </Box>
              </Box>

              {/* Contact Windows Content */}
              <Box sx={{ maxHeight: '400px', overflow: 'hidden' }}>
                <ContactWindows 
                  satelliteId={satelliteId} 
                  groundStationId={groundStationId}
                  compact={true}
                />
              </Box>
            </>
          )}
        </Paper>
      </Popover>
    </>
  );
};

export default ContactWindowsPopover;