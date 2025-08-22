import React, { useEffect, useState } from "react";
import {
  Box,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  LinearProgress,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  AlertTitle,
  Paper,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchContactWindows,
  refreshContactWindows,
  selectContactWindows,
  selectContactWindowsStatus,
  selectContactWindowsError,
} from "../store/contactWindowsSlice";
import { AppDispatch } from "../store";
import { toast } from "react-toastify";
import RefreshIcon from "@mui/icons-material/Refresh";
import SignalCellularAltIcon from "@mui/icons-material/SignalCellularAlt";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TimelineIcon from "@mui/icons-material/Timeline";
import VisibilityIcon from "@mui/icons-material/Visibility";
import "react-toastify/dist/ReactToastify.css";

interface ContactWindowsProps {
  satelliteId: string;
  groundStationId: string;
  compact?: boolean;
}

interface ContactWindow {
  _id: string;
  satelliteId: string;
  groundStationId: string;
  scheduledAOS: string;
  scheduledLOS: string;
  maxElevationDeg: number;
  durationSeconds: number;
  status: string;
}

const ContactWindows: React.FC<ContactWindowsProps> = ({
  satelliteId,
  groundStationId,
  compact = false,
}) => {
  const dispatch: AppDispatch = useDispatch();
  const contactWindows = useSelector(selectContactWindows);
  const status = useSelector(selectContactWindowsStatus);
  const error = useSelector(selectContactWindowsError);
  
  const [showPastWindows, setShowPastWindows] = useState(false);
  const [sortBy, setSortBy] = useState<'aos' | 'duration' | 'elevation'>('aos');
  const [timeZone, setTimeZone] = useState<'utc' | 'local'>('local');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (satelliteId && groundStationId) {
      console.log("Fetching Contact Windows for:", {
        satelliteId,
        groundStationId,
      });
      dispatch(fetchContactWindows({ satelliteId, groundStationId }));
    }
  }, [dispatch, satelliteId, groundStationId]);

  // Filter and sort contact windows
  const filteredWindows = contactWindows
    .filter((window: any) => {
      if (showPastWindows) return true;
      return new Date(window.scheduledLOS) > new Date();
    })
    .sort((a: any, b: any) => {
      switch (sortBy) {
        case 'duration':
          return b.durationSeconds - a.durationSeconds;
        case 'elevation':
          return b.maxElevationDeg - a.maxElevationDeg;
        case 'aos':
        default:
          return new Date(a.scheduledAOS).getTime() - new Date(b.scheduledAOS).getTime();
      }
    });

  // Calculate statistics
  const now = new Date();
  const activeWindow = contactWindows.find((window: any) => 
    new Date(window.scheduledAOS) <= now && new Date(window.scheduledLOS) >= now
  );
  const upcomingWindows = contactWindows.filter((window: any) => 
    new Date(window.scheduledAOS) > now
  );
  const totalDuration = filteredWindows.reduce((sum: number, window: any) => sum + window.durationSeconds, 0);
  const avgElevation = filteredWindows.length > 0 
    ? filteredWindows.reduce((sum: number, window: any) => sum + window.maxElevationDeg, 0) / filteredWindows.length 
    : 0;

  const handleRefreshContactWindows = async () => {
    if (!satelliteId || !groundStationId) {
      toast.error("Please select both a satellite and ground station.", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    try {
      setRefreshing(true);
      console.log(`[ContactWindows] Triggering refresh for satellite ${satelliteId} and ground station ${groundStationId}`);
      
      await dispatch(refreshContactWindows({ satelliteId, groundStationId })).unwrap();
      
      toast.success("Contact windows refreshed successfully!", {
        position: "top-right",
        autoClose: 3000,
      });
    } catch (err) {
      console.error("[ContactWindows] Failed to refresh contact windows:", err);
      toast.error("Failed to refresh contact windows.", {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setRefreshing(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    if (timeZone === 'utc') {
      return date.toISOString().slice(11, 19) + ' UTC';
    }
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const getWindowStatus = (window: ContactWindow) => {
    const now = new Date();
    const aos = new Date(window.scheduledAOS);
    const los = new Date(window.scheduledLOS);
    
    if (aos <= now && los >= now) return 'active';
    if (aos > now) return 'upcoming';
    return 'past';
  };

  const getStatusChip = (window: ContactWindow) => {
    const status = getWindowStatus(window);
    const colors = {
      active: { bg: '#00ff41', color: '#000', label: 'LIVE' },
      upcoming: { bg: '#ffaa00', color: '#000', label: 'UPCOMING' },
      past: { bg: '#666', color: '#fff', label: 'PAST' }
    };
    
    const config = colors[status];
    
    return (
      <Chip
        label={config.label}
        size="small"
        sx={{
          backgroundColor: config.bg,
          color: config.color,
          fontWeight: 'bold',
          fontSize: '10px',
          fontFamily: 'inherit',
          animation: status === 'active' ? 'pulse 2s infinite' : 'none',
        }}
      />
    );
  };

  const getElevationColor = (elevation: number) => {
    if (elevation >= 60) return '#00ff41'; // Excellent
    if (elevation >= 30) return '#ffaa00'; // Good
    if (elevation >= 10) return '#ff6600'; // Fair
    return '#ff4444'; // Poor
  };

  const getDurationBar = (duration: number) => {
    const maxDuration = Math.max(...filteredWindows.map((w: any) => w.durationSeconds), 1);
    const percentage = (duration / maxDuration) * 100;
    
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
        <LinearProgress
          variant="determinate"
          value={percentage}
          sx={{
            flex: 1,
            height: 6,
            borderRadius: 3,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            '& .MuiLinearProgress-bar': {
              backgroundColor: '#00ff41',
              borderRadius: 3,
            },
          }}
        />
        <Typography variant="caption" sx={{ color: '#00ff41', fontFamily: 'inherit', minWidth: '40px' }}>
          {Math.round(duration / 60)}m
        </Typography>
      </Box>
    );
  };

  if (status === "loading" && !refreshing) {
    return (
      <Box sx={{ padding: 2, textAlign: 'center' }}>
        <LinearProgress sx={{ mb: 1, backgroundColor: 'rgba(0, 255, 65, 0.1)' }} />
        <Typography variant="body2" sx={{ color: '#00ff41', fontFamily: 'inherit' }}>
          Loading contact windows...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ padding: 2 }}>
        <Alert severity="error" sx={{ backgroundColor: 'rgba(255, 0, 0, 0.1)', color: '#ff4444' }}>
          <AlertTitle>Error Loading Contact Windows</AlertTitle>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: "100%",
        color: "#00ff41",
        fontFamily: "'Courier New', Courier, monospace",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        maxHeight: compact ? '400px' : 'none',
      }}
    >
      {/* Statistics Panel */}
      {!compact && (
        <Paper 
          elevation={0}
          sx={{ 
            margin: 2, 
            padding: 2, 
            backgroundColor: 'rgba(0, 255, 65, 0.05)',
            border: '1px solid rgba(0, 255, 65, 0.2)',
            borderRadius: 2
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ color: '#00ff41', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 1 }}>
              <TimelineIcon /> CONTACT ANALYSIS
            </Typography>
            {activeWindow && (
              <Chip 
                label="CONTACT IN PROGRESS" 
                icon={<SignalCellularAltIcon />}
                sx={{
                  backgroundColor: '#00ff41',
                  color: '#000',
                  fontWeight: 'bold',
                  animation: 'pulse 2s infinite',
                }}
              />
            )}
          </Box>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ color: '#00ff41', fontFamily: 'inherit', fontWeight: 'bold' }}>
                {upcomingWindows.length}
              </Typography>
              <Typography variant="caption" sx={{ color: '#666', fontFamily: 'inherit' }}>
                Upcoming Passes
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ color: '#00ff41', fontFamily: 'inherit', fontWeight: 'bold' }}>
                {Math.round(totalDuration / 60)}m
              </Typography>
              <Typography variant="caption" sx={{ color: '#666', fontFamily: 'inherit' }}>
                Total Duration
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ color: '#00ff41', fontFamily: 'inherit', fontWeight: 'bold' }}>
                {avgElevation.toFixed(0)}°
              </Typography>
              <Typography variant="caption" sx={{ color: '#666', fontFamily: 'inherit' }}>
                Avg Elevation
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ color: '#00ff41', fontFamily: 'inherit', fontWeight: 'bold' }}>
                {filteredWindows.length > 0 ? Math.max(...filteredWindows.map((w: any) => w.maxElevationDeg)).toFixed(0) : 0}°
              </Typography>
              <Typography variant="caption" sx={{ color: '#666', fontFamily: 'inherit' }}>
                Best Elevation
              </Typography>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Controls */}
      <Box sx={{ 
        padding: compact ? 1 : 2, 
        borderBottom: '1px solid rgba(0, 255, 65, 0.2)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 2,
        flexWrap: 'wrap'
      }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Tooltip title="Refresh Contact Windows">
            <IconButton
              onClick={handleRefreshContactWindows}
              disabled={refreshing}
              sx={{
                color: '#00ff41',
                border: '1px solid #00ff41',
                borderRadius: 1,
                '&:hover': {
                  backgroundColor: 'rgba(0, 255, 65, 0.1)',
                },
              }}
            >
              <RefreshIcon sx={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            </IconButton>
          </Tooltip>
          
          {!compact && (
            <>
              <FormControlLabel
                control={
                  <Switch
                    checked={showPastWindows}
                    onChange={(e) => setShowPastWindows(e.target.checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#00ff41',
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: '#00ff41',
                      },
                    }}
                  />
                }
                label="Show Past"
                sx={{ color: '#aaa', fontFamily: 'inherit' }}
              />
              
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel sx={{ color: '#aaa' }}>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  label="Sort By"
                  onChange={(e) => setSortBy(e.target.value as any)}
                  sx={{
                    color: '#00ff41',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(0, 255, 65, 0.3)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#00ff41',
                    },
                  }}
                >
                  <MenuItem value="aos">Time</MenuItem>
                  <MenuItem value="duration">Duration</MenuItem>
                  <MenuItem value="elevation">Elevation</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl size="small" sx={{ minWidth: 100 }}>
                <InputLabel sx={{ color: '#aaa' }}>Time Zone</InputLabel>
                <Select
                  value={timeZone}
                  label="Time Zone"
                  onChange={(e) => setTimeZone(e.target.value as any)}
                  sx={{
                    color: '#00ff41',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(0, 255, 65, 0.3)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#00ff41',
                    },
                  }}
                >
                  <MenuItem value="local">Local</MenuItem>
                  <MenuItem value="utc">UTC</MenuItem>
                </Select>
              </FormControl>
            </>
          )}
        </Box>
      </Box>

      {status === "succeeded" && filteredWindows.length === 0 && (
        <Box sx={{ padding: 3, textAlign: 'center' }}>
          <VisibilityIcon sx={{ color: '#666', fontSize: 48, mb: 1 }} />
          <Typography variant="h6" sx={{ color: '#666', fontFamily: 'inherit', mb: 1 }}>
            No Contact Windows Found
          </Typography>
          <Typography variant="body2" sx={{ color: '#888', fontFamily: 'inherit' }}>
            {showPastWindows ? 'No contact windows available for this satellite-ground station pair.' : 'No upcoming contact windows. Try showing past windows or refresh the data.'}
          </Typography>
        </Box>
      )}

      {status === "succeeded" && filteredWindows.length > 0 && (
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <Table
            size={compact ? "small" : "medium"}
            sx={{
              color: "#00ff41",
              fontFamily: 'inherit',
              '& .MuiTableCell-root': {
                borderBottom: '1px solid rgba(0, 255, 65, 0.1)',
                fontFamily: 'inherit',
              },
            }}
          >
            <TableHead>
              <TableRow sx={{ backgroundColor: 'rgba(0, 255, 65, 0.05)' }}>
                <TableCell sx={{ color: "#00ff41", fontWeight: 'bold', fontFamily: 'inherit' }}>
                  STATUS
                </TableCell>
                <TableCell sx={{ color: "#00ff41", fontWeight: 'bold', fontFamily: 'inherit' }}>
                  DATE
                </TableCell>
                <TableCell sx={{ color: "#00ff41", fontWeight: 'bold', fontFamily: 'inherit' }}>
                  AOS
                </TableCell>
                <TableCell sx={{ color: "#00ff41", fontWeight: 'bold', fontFamily: 'inherit' }}>
                  LOS
                </TableCell>
                <TableCell sx={{ color: "#00ff41", fontWeight: 'bold', fontFamily: 'inherit' }}>
                  DURATION
                </TableCell>
                <TableCell sx={{ color: "#00ff41", fontWeight: 'bold', fontFamily: 'inherit' }}>
                  MAX ELEV
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredWindows.slice(0, compact ? 5 : undefined).map((window: ContactWindow) => (
                <TableRow
                  key={window._id}
                  sx={{
                    backgroundColor: getWindowStatus(window) === 'active' ? 'rgba(0, 255, 65, 0.1)' : 'transparent',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 255, 65, 0.05)',
                    },
                  }}
                >
                  <TableCell sx={{ padding: compact ? '4px 8px' : '8px 16px' }}>
                    {getStatusChip(window)}
                  </TableCell>
                  <TableCell sx={{ color: "#aaa", fontFamily: 'inherit', padding: compact ? '4px 8px' : '8px 16px' }}>
                    {formatDate(window.scheduledAOS)}
                  </TableCell>
                  <TableCell sx={{ color: "#00ff41", fontFamily: 'inherit', padding: compact ? '4px 8px' : '8px 16px' }}>
                    {formatTime(window.scheduledAOS)}
                  </TableCell>
                  <TableCell sx={{ color: "#00ff41", fontFamily: 'inherit', padding: compact ? '4px 8px' : '8px 16px' }}>
                    {formatTime(window.scheduledLOS)}
                  </TableCell>
                  <TableCell sx={{ padding: compact ? '4px 8px' : '8px 16px', minWidth: compact ? '80px' : '120px' }}>
                    {compact ? (
                      <Typography variant="caption" sx={{ color: '#00ff41', fontFamily: 'inherit' }}>
                        {Math.round(window.durationSeconds / 60)}m
                      </Typography>
                    ) : (
                      getDurationBar(window.durationSeconds)
                    )}
                  </TableCell>
                  <TableCell sx={{ padding: compact ? '4px 8px' : '8px 16px' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: getElevationColor(window.maxElevationDeg),
                          fontFamily: 'inherit',
                          fontWeight: 'bold'
                        }}
                      >
                        {window.maxElevationDeg.toFixed(1)}°
                      </Typography>
                      {!compact && (
                        <TrendingUpIcon 
                          sx={{ 
                            color: getElevationColor(window.maxElevationDeg),
                            fontSize: 16
                          }} 
                        />
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {compact && filteredWindows.length > 5 && (
            <Box sx={{ padding: 1, textAlign: 'center', borderTop: '1px solid rgba(0, 255, 65, 0.1)' }}>
              <Typography variant="caption" sx={{ color: '#666', fontFamily: 'inherit' }}>
                Showing 5 of {filteredWindows.length} contact windows
              </Typography>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default ContactWindows;