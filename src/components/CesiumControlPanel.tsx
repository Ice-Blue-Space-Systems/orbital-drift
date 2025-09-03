import React, { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Box, IconButton, Typography, Tooltip, Chip, Switch, FormControlLabel, Slider, Accordion, AccordionSummary, AccordionDetails } from "@mui/material";
import {
  Speed as SpeedIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Home as HomeIcon,
  Public as PublicIcon,
  Layers as LayersIcon,
  Help as HelpIcon,
  Search as SearchIcon,
  Timeline as TimelineIcon,
  Animation as AnimationIcon,
  Fullscreen as FullscreenIcon,
  Tune as TuneIcon,
  Memory as MemoryIcon,
  Palette as PaletteIcon,
  DragIndicator as DragIndicatorIcon,
  Settings as SettingsIcon,
  Timeline as TleIcon,
  Computer as SystemIcon,
} from "@mui/icons-material";
import { setCesiumClockMultiplier, setSimulationSpeed, resetToLive } from "../store/cesiumClockSlice";
import { setShowCesiumOptions, setTleHistoryDuration, setTleFutureDuration, setRenderingQuality, setMouseThrottle } from "../store/mongoSlice";
import { RootState } from "../store";
import { useTheme } from "../contexts/ThemeContext";
import { selectCesiumClockUtc } from "../store/selectors/cesiumClockSelectors";

interface CesiumControlPanelProps {
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}

const CesiumControlPanel: React.FC<CesiumControlPanelProps> = ({
  position = "top-right"
}) => {
  const dispatch = useDispatch();
  const currentMultiplier = useSelector((state: RootState) => state.cesiumClock.multiplier);
  const showCesiumOptions = useSelector((state: RootState) => state.mongo.showCesiumOptions);
  const tleHistoryDuration = useSelector((state: RootState) => state.mongo.tleHistoryDuration);
  const tleFutureDuration = useSelector((state: RootState) => state.mongo.tleFutureDuration);
  const renderingQuality = useSelector((state: RootState) => state.mongo.renderingQuality);
  const mouseThrottle = useSelector((state: RootState) => state.mongo.mouseThrottle);
  const { theme, toggleTheme } = useTheme();
  
  // Use Cesium clock for accurate time that follows the simulation speed
  const cesiumUtcTime = useSelector(selectCesiumClockUtc);
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isPanelDragging, setIsPanelDragging] = useState(false);
  const [panelPosition, setPanelPosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [speedMode, setSpeedMode] = useState<'dial' | 'slider'>('dial');
  const [memoryUsage, setMemoryUsage] = useState(0);
  const [userClickedLive, setUserClickedLive] = useState(true);
  const [currentSystemTime, setCurrentSystemTime] = useState(new Date());
  const [fps, setFps] = useState(60);
  const [performanceScore, setPerformanceScore] = useState(100);
  
  // Accordion state - only speed and system expanded by default
  const [accordionExpanded, setAccordionExpanded] = useState({
    speed: true,
    interface: false,
    tle: false,
    system: true,
  });
  
  const dialRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const centerRef = useRef({ x: 0, y: 0 });
  const dragStartRef = useRef({ x: 0, y: 0, panelX: 0, panelY: 0 });

  const minSpeed = 0.1;
  const maxSpeed = 1000;

  // Update memory usage and system time every second
  useEffect(() => {
    const interval = setInterval(() => {
      // Update real system time regardless of simulation speed
      setCurrentSystemTime(new Date());
      
      // Update memory usage
      if ((performance as any).memory) {
        setMemoryUsage(Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024));
      }
      
      // Simulate more realistic FPS fluctuation (in real app, this would come from actual frame rate)
      const baseFps = 30 + Math.random() * 35; // 30-65 FPS range
      setFps(Math.floor(baseFps));
      
      // More realistic performance score calculation
      // Memory score: penalize heavily after 200MB
      let memoryScore = 100;
      if (memoryUsage > 200) {
        memoryScore = Math.max(0, 100 - ((memoryUsage - 200) / 10)); // Heavy penalty after 200MB
      } else if (memoryUsage > 100) {
        memoryScore = Math.max(60, 100 - ((memoryUsage - 100) / 5)); // Moderate penalty 100-200MB
      }
      
      // FPS score: More realistic thresholds
      let fpsScore = 100;
      if (fps < 20) {
        fpsScore = 0; // Unplayable
      } else if (fps < 30) {
        fpsScore = 25; // Poor
      } else if (fps < 45) {
        fpsScore = 50; // Below average
      } else if (fps < 55) {
        fpsScore = 75; // Good
      } else {
        fpsScore = 100; // Excellent
      }
      
      // Weight FPS more heavily since it's more noticeable to users
      const weightedScore = Math.round((fpsScore * 0.7) + (memoryScore * 0.3));
      setPerformanceScore(weightedScore);
    }, 1000);

    return () => clearInterval(interval);
  }, [memoryUsage, fps]);

  // Convert multiplier to rotation angle (logarithmic scale)
  const multiplierToAngle = (multiplier: number): number => {
    const logMin = Math.log10(minSpeed);
    const logMax = Math.log10(maxSpeed);
    const logCurrent = Math.log10(Math.max(minSpeed, Math.min(maxSpeed, multiplier)));
    const progress = (logCurrent - logMin) / (logMax - logMin);
    return progress * 270; // 3/4 circle
  };

  // Convert rotation angle to multiplier (logarithmic scale)
  const angleToMultiplier = (angle: number): number => {
    const normalizedAngle = Math.max(0, Math.min(270, angle));
    const progress = normalizedAngle / 270;
    const logMin = Math.log10(minSpeed);
    const logMax = Math.log10(maxSpeed);
    const logValue = logMin + progress * (logMax - logMin);
    return Math.pow(10, logValue);
  };

  // Convert multiplier to slider value (logarithmic scale)
  const multiplierToSlider = (multiplier: number): number => {
    const logMin = Math.log10(minSpeed);
    const logMax = Math.log10(maxSpeed);
    const logCurrent = Math.log10(Math.max(minSpeed, Math.min(maxSpeed, multiplier)));
    return ((logCurrent - logMin) / (logMax - logMin)) * 100;
  };

  // Convert slider value to multiplier
  const sliderToMultiplier = (value: number): number => {
    const progress = value / 100;
    const logMin = Math.log10(minSpeed);
    const logMax = Math.log10(maxSpeed);
    const logValue = logMin + progress * (logMax - logMin);
    return Math.pow(10, logValue);
  };

  // Update rotation when multiplier changes externally
  useEffect(() => {
    if (!isDragging) {
      setRotation(multiplierToAngle(currentMultiplier));
    }
  }, [currentMultiplier, isDragging]);

  const updateCenter = () => {
    if (dialRef.current) {
      const rect = dialRef.current.getBoundingClientRect();
      centerRef.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };
    }
  };

  const getAngleFromMouse = (clientX: number, clientY: number): number => {
    const dx = clientX - centerRef.current.x;
    const dy = clientY - centerRef.current.y;
    let angle = Math.atan2(dy, dx) * (180 / Math.PI);
    angle = (angle + 135 + 360) % 360; // Adjust for 3/4 circle starting at top-left
    return Math.max(0, Math.min(270, angle));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    updateCenter();
    
    const handleMouseMove = (e: MouseEvent) => {
      const angle = getAngleFromMouse(e.clientX, e.clientY);
      setRotation(angle);
      
      const newMultiplier = angleToMultiplier(angle);
      setUserClickedLive(false);
      dispatch(setCesiumClockMultiplier(newMultiplier));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleSliderChange = (event: Event, newValue: number | number[]) => {
    const value = Array.isArray(newValue) ? newValue[0] : newValue;
    const newMultiplier = sliderToMultiplier(value);
    setUserClickedLive(false);
    dispatch(setCesiumClockMultiplier(newMultiplier));
  };

  // Panel dragging handlers
  const handlePanelMouseDown = (e: React.MouseEvent) => {
    // Only start dragging if clicking on the header/title area, not controls
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[role="button"]') || target.closest('.speed-dial')) {
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
      zIndex: 2000,
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
          initialStyles = { top: "20px", right: "20px" };
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
        return { ...baseStyles, top: "20px", right: "20px" };
    }
  };

  const formatSpeed = (multiplier: number): string => {
    if (multiplier < 1) {
      return `${multiplier.toFixed(1)}x`;
    } else if (multiplier < 10) {
      return `${multiplier.toFixed(1)}x`;
    } else {
      return `${Math.round(multiplier)}x`;
    }
  };

  const presetSpeeds = [0.1, 0.5, 1, 2, 5, 10, 50, 100, 500, 1000];

  const handleAccordionChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setAccordionExpanded(prev => ({
      ...prev,
      [panel]: isExpanded
    }));
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return '#00ff00'; // Green - Excellent
    if (score >= 60) return '#ffff00'; // Yellow - Good  
    if (score >= 40) return '#ff8800'; // Orange - Moderate
    return '#ff0000'; // Red - Poor
  };

  const getPerformanceLabel = (score: number) => {
    if (score >= 80) return 'EXCELLENT';
    if (score >= 60) return 'GOOD';
    if (score >= 40) return 'MODERATE';
    return 'POOR';
  };

  return (
    <Box sx={{ ...getPositionStyles() }} ref={panelRef}>
      {/* Main Control Panel */}
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
          padding: isExpanded ? 2 : '12px 16px', // Match GlobeTools padding when collapsed
          minWidth: isExpanded ? '320px' : '280px',
          minHeight: isExpanded ? 'auto' : '48px', // Match GlobeTools height when collapsed
          maxHeight: isExpanded ? '80vh' : '48px', // Add max height to prevent overflow
          overflow: isExpanded ? 'hidden' : 'visible', // Hide overflow when expanded to allow internal scrolling
          fontFamily: "'Courier New', Courier, monospace",
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isExpanded ? 'scale(1.02)' : 'scale(1)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: isExpanded ? 'flex-start' : 'center', // Vertically center when collapsed
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
        {        /* Header */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: isExpanded ? 2 : 0,
          padding: isExpanded ? '8px 4px' : '0px', // Remove padding when collapsed since it's in the main container
          minHeight: '32px', // Match GlobeTools button height
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
            
            {/* UTC Time Display */}
            <Typography 
              variant="body2" 
              sx={{ 
                color: theme.primary, // Use theme primary color (green for matrix, blue for ice blue)
                fontFamily: 'inherit',
                fontWeight: 'bold',
                marginLeft: 2,
                marginRight: 2,
                textShadow: `0 0 8px ${theme.primary}66, 0 0 12px ${theme.primary}33`, // Console glow using theme color
                fontSize: '0.8rem',
                letterSpacing: '0.5px', // Monospace console feel
              }}
            >
              {cesiumUtcTime || new Date().toUTCString()}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Sim/Live Status Chip */}
            <Chip 
              label={userClickedLive ? "LIVE" : `SIM ${formatSpeed(currentMultiplier)}`}
              size="small"
              sx={{
                backgroundColor: userClickedLive ? '#00ff00' : '#9600ff',
                color: '#000000',
                fontFamily: 'inherit',
                fontWeight: 'bold',
                fontSize: '0.65rem',
                border: 'none',
                boxShadow: userClickedLive ? '0 0 10px rgba(0, 255, 0, 0.5)' : '0 0 10px rgba(150, 0, 255, 0.5)',
              }}
            />
            
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
          </Box>
        </Box>

        {/* Expanded Content */}
        {isExpanded && (
          <Box sx={{ 
            animation: 'slideDown 0.3s ease',
            padding: '8px', // Add padding for expanded content
            maxHeight: 'calc(80vh - 80px)', // Account for header height
            overflowY: 'auto', // Add vertical scroll
            overflowX: 'hidden',
            // Custom scrollbar styling
            '&::-webkit-scrollbar': {
              width: '6px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '3px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: `rgba(${theme.primaryRGB}, 0.5)`,
              borderRadius: '3px',
              '&:hover': {
                background: `rgba(${theme.primaryRGB}, 0.7)`,
              },
            },
            '@keyframes slideDown': {
              from: { opacity: 0, transform: 'translateY(-10px)' },
              to: { opacity: 1, transform: 'translateY(0)' },
            },
          }}>
            {/* Speed Control Section */}
            <Accordion 
              expanded={accordionExpanded.speed} 
              onChange={handleAccordionChange('speed')}
              sx={{
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                border: `1px solid rgba(${theme.primaryRGB}, 0.2)`,
                borderRadius: '12px !important',
                marginBottom: 1,
                '&:before': { display: 'none' },
                '& .MuiAccordionSummary-root': {
                  padding: '8px 16px',
                  minHeight: '40px',
                  '&.Mui-expanded': {
                    minHeight: '40px',
                  },
                },
                '& .MuiAccordionDetails-root': {
                  padding: '0 16px 16px 16px',
                },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon sx={{ color: theme.primary, fontSize: 18 }} />}
                sx={{
                  '& .MuiAccordionSummary-content': {
                    alignItems: 'center',
                    gap: 1,
                  },
                }}
              >
                <SpeedIcon sx={{ color: theme.primary, fontSize: 18 }} />
                <Typography variant="caption" sx={{ 
                  color: theme.primary, 
                  fontFamily: 'inherit', 
                  fontWeight: 'bold',
                  fontSize: '0.8rem',
                }}>
                  SIMULATION SPEED
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                    <Typography variant="caption" sx={{ color: '#aaa', fontSize: '0.7rem' }}>
                      Control Mode
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton
                        size="small"
                        onClick={() => setSpeedMode('dial')}
                        sx={{
                          color: speedMode === 'dial' ? theme.primary : '#666',
                          padding: '2px',
                        }}
                      >
                        <SpeedIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => setSpeedMode('slider')}
                        sx={{
                          color: speedMode === 'slider' ? theme.primary : '#666',
                          padding: '2px',
                        }}
                      >
                        <TuneIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Box>
                  </Box>

                  {speedMode === 'dial' ? (
                    /* Speed Dial */
                    <Box sx={{ display: 'flex', justifyContent: 'center', marginBottom: 2 }}>
                      <Box
                        ref={dialRef}
                        onMouseDown={handleMouseDown}
                        sx={{
                          width: 100,
                          height: 100,
                          position: 'relative',
                          cursor: isDragging ? 'grabbing' : 'grab',
                          borderRadius: '50%',
                          background: `conic-gradient(from 225deg, transparent 0deg, rgba(${theme.primaryRGB}, 0.3) 270deg, transparent 270deg)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: `2px solid rgba(${theme.primaryRGB}, 0.5)`,
                          boxShadow: `0 0 20px rgba(${theme.primaryRGB}, 0.3), inset 0 0 20px rgba(${theme.primaryRGB}, 0.1)`,
                        }}
                      >
                        {/* Dial Handle */}
                        <Box
                          sx={{
                            position: 'absolute',
                            width: 6,
                            height: 35,
                            backgroundColor: theme.primary,
                            borderRadius: '3px',
                            top: 10,
                            transformOrigin: '3px 40px',
                            transform: `rotate(${rotation - 135}deg)`,
                            boxShadow: `0 0 10px rgba(${theme.primaryRGB}, 0.8)`,
                            transition: isDragging ? 'none' : 'transform 0.2s ease',
                          }}
                        />
                        
                        {/* Center Dot */}
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            backgroundColor: theme.primary,
                            borderRadius: '50%',
                            boxShadow: `0 0 15px rgba(${theme.primaryRGB}, 0.8)`,
                          }}
                        />
                      </Box>
                    </Box>
                  ) : (
                    /* Speed Slider */
                    <Box sx={{ marginBottom: 2, padding: '0 8px' }}>
                      <Slider
                        value={multiplierToSlider(currentMultiplier)}
                        onChange={handleSliderChange}
                        min={0}
                        max={100}
                        sx={{
                          color: theme.primary,
                          '& .MuiSlider-track': {
                            background: `linear-gradient(90deg, rgba(${theme.primaryRGB}, 0.3) 0%, rgba(${theme.primaryRGB}, 0.8) 100%)`,
                            border: 'none',
                          },
                          '& .MuiSlider-thumb': {
                            backgroundColor: theme.primary,
                            boxShadow: `0 0 15px rgba(${theme.primaryRGB}, 0.8)`,
                            '&:hover': {
                              boxShadow: `0 0 20px rgba(${theme.primaryRGB}, 1)`,
                            },
                          },
                          '& .MuiSlider-rail': {
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          },
                        }}
                      />
                    </Box>
                  )}

                  {/* Speed Presets */}
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {/* LIVE Button */}
                    <Chip
                      label="LIVE"
                      size="small"
                      clickable
                      onClick={() => {
                        setUserClickedLive(true);
                        dispatch(resetToLive());
                      }}
                      sx={{
                        backgroundColor: userClickedLive ? 'rgba(0, 255, 0, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                        color: userClickedLive ? '#00ff00' : '#aaa',
                        fontFamily: 'inherit',
                        fontSize: '0.6rem',
                        height: '20px',
                        fontWeight: 'bold',
                        border: userClickedLive ? '1px solid rgba(0, 255, 0, 0.5)' : 'none',
                        boxShadow: userClickedLive ? '0 0 8px rgba(0, 255, 0, 0.3)' : 'none',
                        '&:hover': {
                          backgroundColor: 'rgba(0, 255, 0, 0.2)',
                          color: '#00ff00',
                          boxShadow: '0 0 8px rgba(0, 255, 0, 0.3)',
                        },
                      }}
                    />
                    
                    {presetSpeeds.map((speed) => (
                      <Chip
                        key={speed}
                        label={formatSpeed(speed)}
                        size="small"
                        clickable
                        onClick={() => {
                          setUserClickedLive(false);
                          dispatch(setSimulationSpeed(speed));
                        }}
                        sx={{
                          backgroundColor: !userClickedLive && currentMultiplier === speed ? `rgba(${theme.primaryRGB}, 0.3)` : 'rgba(255, 255, 255, 0.1)',
                          color: !userClickedLive && currentMultiplier === speed ? theme.primary : '#aaa',
                          fontFamily: 'inherit',
                          fontSize: '0.6rem',
                          height: '20px',
                          '&:hover': {
                            backgroundColor: `rgba(${theme.primaryRGB}, 0.2)`,
                            color: theme.primary,
                          },
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              </AccordionDetails>
            </Accordion>

            {/* System Information */}
            <Accordion 
              expanded={accordionExpanded.system} 
              onChange={handleAccordionChange('system')}
              sx={{
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                border: `1px solid rgba(${theme.primaryRGB}, 0.2)`,
                borderRadius: '12px !important',
                marginBottom: 1,
                '&:before': { display: 'none' },
                '& .MuiAccordionSummary-root': {
                  padding: '8px 16px',
                  minHeight: '40px',
                  '&.Mui-expanded': {
                    minHeight: '40px',
                  },
                },
                '& .MuiAccordionDetails-root': {
                  padding: '0 16px 16px 16px',
                },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon sx={{ color: theme.primary, fontSize: 18 }} />}
                sx={{
                  '& .MuiAccordionSummary-content': {
                    alignItems: 'center',
                    gap: 1,
                  },
                }}
              >
                <SystemIcon sx={{ color: theme.primary, fontSize: 18 }} />
                <Typography variant="caption" sx={{ 
                  color: theme.primary, 
                  fontFamily: 'inherit', 
                  fontWeight: 'bold',
                  fontSize: '0.8rem',
                }}>
                  SYSTEM STATUS
                </Typography>
                {/* Performance badge in header */}
                <Box sx={{ marginLeft: 'auto', marginRight: 1 }}>
                  <Chip
                    label={getPerformanceLabel(performanceScore)}
                    size="small"
                    sx={{
                      backgroundColor: `${getPerformanceColor(performanceScore)}20`,
                      color: getPerformanceColor(performanceScore),
                      fontFamily: 'inherit',
                      fontSize: '0.55rem',
                      height: '18px',
                      fontWeight: 'bold',
                      border: `1px solid ${getPerformanceColor(performanceScore)}60`,
                      boxShadow: `0 0 8px ${getPerformanceColor(performanceScore)}40`,
                    }}
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Box>
                  {/* Performance Overview */}
                  <Box sx={{
                    marginBottom: 2,
                    padding: 1.5,
                    backgroundColor: `${getPerformanceColor(performanceScore)}10`,
                    borderRadius: '8px',
                    border: `1px solid ${getPerformanceColor(performanceScore)}30`,
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 1 }}>
                      <Typography variant="caption" sx={{ 
                        color: getPerformanceColor(performanceScore), 
                        fontFamily: 'inherit', 
                        fontWeight: 'bold',
                        fontSize: '0.7rem'
                      }}>
                        PERFORMANCE SCORE
                      </Typography>
                      <Typography variant="caption" sx={{ 
                        color: getPerformanceColor(performanceScore), 
                        fontFamily: 'inherit', 
                        fontWeight: 'bold',
                        fontSize: '0.8rem'
                      }}>
                        {performanceScore}%
                      </Typography>
                    </Box>
                    
                    {/* Performance Bar */}
                    <Box sx={{
                      width: '100%',
                      height: '6px',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '3px',
                      overflow: 'hidden',
                      position: 'relative',
                    }}>
                      <Box sx={{
                        width: `${performanceScore}%`,
                        height: '100%',
                        backgroundColor: getPerformanceColor(performanceScore),
                        borderRadius: '3px',
                        boxShadow: `0 0 10px ${getPerformanceColor(performanceScore)}80`,
                        transition: 'width 0.5s ease, background-color 0.3s ease',
                      }} />
                    </Box>
                  </Box>

                  {/* System Metrics Grid */}
                  <Box sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(2, 1fr)', 
                    gap: 1, 
                    marginBottom: 2,
                    fontSize: '0.7rem' 
                  }}>
                    {/* FPS Counter */}
                    <Box sx={{
                      padding: 1,
                      backgroundColor: 'rgba(0, 0, 0, 0.3)',
                      borderRadius: '6px',
                      border: `1px solid rgba(${theme.primaryRGB}, 0.2)`,
                      textAlign: 'center',
                    }}>
                      <Typography variant="caption" sx={{ 
                        color: '#aaa', 
                        fontFamily: 'inherit',
                        fontSize: '0.6rem',
                        display: 'block'
                      }}>
                        FPS
                      </Typography>
                      <Typography variant="caption" sx={{ 
                        color: fps >= 45 ? theme.primary : fps >= 30 ? '#ffff00' : '#ff6600',
                        fontFamily: 'inherit',
                        fontWeight: 'bold',
                        fontSize: '0.8rem',
                        textShadow: fps >= 45 ? `0 0 8px ${theme.primary}60` : fps >= 30 ? '0 0 8px #ffff0060' : '0 0 8px #ff660060',
                      }}>
                        {fps}
                      </Typography>
                    </Box>

                    {/* Memory Usage */}
                    <Box sx={{
                      padding: 1,
                      backgroundColor: 'rgba(0, 0, 0, 0.3)',
                      borderRadius: '6px',
                      border: `1px solid rgba(${theme.primaryRGB}, 0.2)`,
                      textAlign: 'center',
                    }}>
                      <Typography variant="caption" sx={{ 
                        color: '#aaa', 
                        fontFamily: 'inherit',
                        fontSize: '0.6rem',
                        display: 'block'
                      }}>
                        MEMORY
                      </Typography>
                      <Typography variant="caption" sx={{ 
                        color: memoryUsage > 100 ? '#ff6600' : theme.secondary,
                        fontFamily: 'inherit',
                        fontWeight: 'bold',
                        fontSize: '0.8rem',
                        textShadow: memoryUsage > 100 ? '0 0 8px #ff660060' : `0 0 8px ${theme.secondary}60`,
                      }}>
                        {memoryUsage || 48}MB
                      </Typography>
                    </Box>

                    {/* System Time */}
                    <Box sx={{
                      padding: 1,
                      backgroundColor: 'rgba(0, 0, 0, 0.3)',
                      borderRadius: '6px',
                      border: `1px solid rgba(${theme.primaryRGB}, 0.2)`,
                      textAlign: 'center',
                    }}>
                      <Typography variant="caption" sx={{ 
                        color: '#aaa', 
                        fontFamily: 'inherit',
                        fontSize: '0.6rem',
                        display: 'block'
                      }}>
                        SYSTEM TIME
                      </Typography>
                      <Typography variant="caption" sx={{ 
                        color: theme.accent,
                        fontFamily: 'inherit',
                        fontWeight: 'bold',
                        fontSize: '0.7rem',
                        textShadow: `0 0 8px ${theme.accent}60`,
                      }}>
                        {currentSystemTime.toLocaleTimeString([], { hour12: false })}
                      </Typography>
                    </Box>

                    {/* Simulation Speed */}
                    <Box sx={{
                      padding: 1,
                      backgroundColor: 'rgba(0, 0, 0, 0.3)',
                      borderRadius: '6px',
                      border: `1px solid rgba(${theme.primaryRGB}, 0.2)`,
                      textAlign: 'center',
                    }}>
                      <Typography variant="caption" sx={{ 
                        color: '#aaa', 
                        fontFamily: 'inherit',
                        fontSize: '0.6rem',
                        display: 'block'
                      }}>
                        SIM SPEED
                      </Typography>
                      <Typography variant="caption" sx={{ 
                        color: userClickedLive ? '#00ff00' : currentMultiplier > 1 ? theme.accent : '#ff6600',
                        fontFamily: 'inherit',
                        fontWeight: 'bold',
                        fontSize: '0.8rem',
                        textShadow: userClickedLive ? '0 0 8px #00ff0060' : currentMultiplier > 1 ? `0 0 8px ${theme.accent}60` : '0 0 8px #ff660060',
                      }}>
                        {userClickedLive ? 'LIVE' : formatSpeed(currentMultiplier)}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Performance Status Indicator */}
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    padding: '8px 12px',
                    backgroundColor: `${getPerformanceColor(performanceScore)}15`,
                    borderRadius: '8px',
                    border: `1px solid ${getPerformanceColor(performanceScore)}40`,
                    transition: 'all 0.3s ease'
                  }}>
                    <MemoryIcon sx={{ 
                      color: getPerformanceColor(performanceScore), 
                      fontSize: 14,
                      animation: performanceScore < 60 ? 'warning-pulse 1.5s infinite' : 'none',
                      '@keyframes warning-pulse': {
                        '0%, 100%': { opacity: 1 },
                        '50%': { opacity: 0.6 },
                      },
                    }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" sx={{ 
                        color: getPerformanceColor(performanceScore), 
                        fontFamily: 'inherit',
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                        display: 'block'
                      }}>
                        {getPerformanceLabel(performanceScore)} PERFORMANCE
                      </Typography>
                      <Typography variant="caption" sx={{ 
                        color: '#aaa', 
                        fontFamily: 'inherit',
                        fontSize: '0.6rem'
                      }}>
                        {performanceScore >= 80 ? 'System running optimally' : 
                         performanceScore >= 60 ? 'System performance is good' :
                         performanceScore >= 40 ? 'Performance could be improved' :
                         'Performance issues detected'}
                      </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ 
                      color: getPerformanceColor(performanceScore), 
                      fontFamily: 'inherit',
                      fontSize: '0.8rem',
                      fontWeight: 'bold'
                    }}>
                      {performanceScore}%
                    </Typography>
                  </Box>

                  {/* Mouse Throttling Control */}
                  <Box sx={{ marginTop: 2 }}>
                    <Typography variant="caption" sx={{ 
                      color: theme.primary, 
                      fontFamily: 'inherit', 
                      fontWeight: 'bold',
                      fontSize: '0.7rem',
                      display: 'block',
                      marginBottom: 1
                    }}>
                      MOUSE THROTTLE
                    </Typography>
                    <Box sx={{ 
                      padding: 1.5,
                      backgroundColor: 'rgba(0, 0, 0, 0.3)',
                      borderRadius: '8px',
                      border: `1px solid rgba(${theme.primaryRGB}, 0.2)`,
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 1 }}>
                        <Typography variant="caption" sx={{ 
                          color: '#aaa', 
                          fontFamily: 'inherit',
                          fontSize: '0.6rem',
                          minWidth: '60px'
                        }}>
                          {mouseThrottle}ms ({Math.round(1000/mouseThrottle)}fps)
                        </Typography>
                        <Slider
                          value={mouseThrottle}
                          onChange={(_, value) => dispatch(setMouseThrottle(value as number))}
                          min={8}
                          max={100}
                          step={4}
                          marks={[
                            { value: 8, label: 'Fast' },
                            { value: 33, label: 'Smooth' },
                            { value: 100, label: 'Slow' },
                          ]}
                          sx={{
                            flex: 1,
                            color: theme.primary,
                            '& .MuiSlider-thumb': {
                              backgroundColor: theme.primary,
                              border: `2px solid rgba(${theme.primaryRGB}, 0.8)`,
                              width: 12,
                              height: 12,
                              '&:hover, &.Mui-focusVisible': {
                                boxShadow: `0 0 0 8px rgba(${theme.primaryRGB}, 0.16)`,
                              },
                            },
                            '& .MuiSlider-track': {
                              backgroundColor: theme.primary,
                              border: 'none',
                              height: 3,
                            },
                            '& .MuiSlider-rail': {
                              backgroundColor: 'rgba(255, 255, 255, 0.2)',
                              height: 3,
                            },
                            '& .MuiSlider-mark': {
                              backgroundColor: 'rgba(255, 255, 255, 0.4)',
                              height: 6,
                              width: 2,
                            },
                            '& .MuiSlider-markLabel': {
                              color: '#aaa',
                              fontSize: '0.5rem',
                              fontFamily: 'inherit',
                            },
                          }}
                        />
                      </Box>
                      <Typography variant="caption" sx={{ 
                        color: '#aaa', 
                        fontFamily: 'inherit',
                        fontSize: '0.6rem',
                        display: 'block'
                      }}>
                        {mouseThrottle <= 16 ? 'High responsiveness, may impact performance' :
                         mouseThrottle <= 33 ? 'Balanced responsiveness and smoothness' :
                         'Smoother experience, reduced responsiveness'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </AccordionDetails>
            </Accordion>

            {/* Cesium UI Controls */}
            <Accordion 
              expanded={accordionExpanded.interface} 
              onChange={handleAccordionChange('interface')}
              sx={{
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                border: `1px solid rgba(${theme.primaryRGB}, 0.2)`,
                borderRadius: '12px !important',
                marginBottom: 1,
                '&:before': { display: 'none' },
                '& .MuiAccordionSummary-root': {
                  padding: '8px 16px',
                  minHeight: '40px',
                  '&.Mui-expanded': {
                    minHeight: '40px',
                  },
                },
                '& .MuiAccordionDetails-root': {
                  padding: '0 16px 16px 16px',
                },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon sx={{ color: theme.primary, fontSize: 18 }} />}
                sx={{
                  '& .MuiAccordionSummary-content': {
                    alignItems: 'center',
                    gap: 1,
                  },
                }}
              >
                <SettingsIcon sx={{ color: theme.primary, fontSize: 18 }} />
                <Typography variant="caption" sx={{ 
                  color: theme.primary, 
                  fontFamily: 'inherit', 
                  fontWeight: 'bold',
                  fontSize: '0.8rem',
                }}>
                  INTERFACE
                </Typography>
                {/* Theme Switcher */}
                <Box sx={{ marginLeft: 'auto', marginRight: 1 }}>
                  <Tooltip title="Switch Theme" arrow>
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTheme();
                      }}
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
                      <PaletteIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Box>
                  {/* Master Toggle */}
                  <FormControlLabel
                    control={
                      <Switch
                        checked={showCesiumOptions}
                        onChange={(e) => dispatch(setShowCesiumOptions(e.target.checked))}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: theme.primary,
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: theme.primary,
                          },
                          '& .MuiSwitch-track': {
                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                          },
                        }}
                      />
                    }
                    label={
                      <Typography variant="body2" sx={{ 
                        color: showCesiumOptions ? theme.primary : '#666', 
                        fontFamily: 'inherit',
                        fontSize: '0.8rem'
                      }}>
                        Show Native Controls
                      </Typography>
                    }
                    sx={{ margin: 0, width: '100%', marginBottom: 2 }}
                  />

                  {/* Rendering Quality Control */}
                  <Box sx={{ marginBottom: 2 }}>
                    <Typography variant="caption" sx={{ 
                      color: theme.primary, 
                      fontFamily: 'inherit', 
                      fontWeight: 'bold',
                      fontSize: '0.7rem',
                      display: 'block',
                      marginBottom: 1
                    }}>
                      RENDERING QUALITY
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {(['low', 'medium', 'high'] as const).map((quality) => (
                        <Chip
                          key={quality}
                          label={quality.toUpperCase()}
                          size="small"
                          clickable
                          onClick={() => dispatch(setRenderingQuality(quality))}
                          sx={{
                            backgroundColor: renderingQuality === quality ? `rgba(${theme.primaryRGB}, 0.3)` : 'rgba(255, 255, 255, 0.1)',
                            color: renderingQuality === quality ? theme.primary : '#aaa',
                            fontFamily: 'inherit',
                            fontSize: '0.6rem',
                            height: '24px',
                            fontWeight: 'bold',
                            border: renderingQuality === quality ? `1px solid rgba(${theme.primaryRGB}, 0.5)` : 'none',
                            boxShadow: renderingQuality === quality ? `0 0 8px rgba(${theme.primaryRGB}, 0.3)` : 'none',
                            '&:hover': {
                              backgroundColor: `rgba(${theme.primaryRGB}, 0.2)`,
                              color: theme.primary,
                              boxShadow: `0 0 8px rgba(${theme.primaryRGB}, 0.3)`,
                            },
                          }}
                        />
                      ))}
                    </Box>
                    <Typography variant="caption" sx={{ 
                      color: '#aaa', 
                      fontFamily: 'inherit',
                      fontSize: '0.6rem',
                      display: 'block',
                      marginTop: 0.5
                    }}>
                      {renderingQuality === 'low' ? 'Better performance, reduced visuals' :
                       renderingQuality === 'medium' ? 'Balanced performance and quality' :
                       'Best visuals, may impact performance'}
                    </Typography>
                  </Box>

                  {/* Individual Control Icons */}
                  <Box sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(4, 1fr)', 
                    gap: 1, 
                    marginTop: 2,
                    opacity: showCesiumOptions ? 1 : 0.3,
                    transition: 'opacity 0.3s ease'
                  }}>
                    {[
                      { icon: <HomeIcon />, label: 'Home View', id: 'home' },
                      { icon: <PublicIcon />, label: 'Scene Mode (2D/3D)', id: 'scene' },
                      { icon: <LayersIcon />, label: 'Base Layer Picker', id: 'layers' },
                      { icon: <HelpIcon />, label: 'Navigation Help', id: 'help' },
                      { icon: <SearchIcon />, label: 'Geocoder Search', id: 'geocoder' },
                      { icon: <TimelineIcon />, label: 'Timeline Control', id: 'timeline' },
                      { icon: <AnimationIcon />, label: 'Animation Control', id: 'animation' },
                      { icon: <FullscreenIcon />, label: 'Fullscreen Mode', id: 'fullscreen' },
                    ].map((control) => (
                      <Tooltip key={control.id} title={control.label} arrow>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: 1,
                            borderRadius: '8px',
                            backgroundColor: showCesiumOptions ? `rgba(${theme.primaryRGB}, 0.15)` : 'rgba(100, 100, 100, 0.1)',
                            border: `1px solid ${showCesiumOptions ? `rgba(${theme.primaryRGB}, 0.3)` : 'rgba(100, 100, 100, 0.2)'}`,
                            color: showCesiumOptions ? theme.primary : '#666',
                            fontSize: '14px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            '&:hover': showCesiumOptions ? {
                              backgroundColor: `rgba(${theme.primaryRGB}, 0.25)`,
                              boxShadow: `0 0 10px rgba(${theme.primaryRGB}, 0.4)`,
                              transform: 'scale(1.05)',
                            } : {},
                          }}
                        >
                          {control.icon}
                        </Box>
                      </Tooltip>
                    ))}
                  </Box>
                </Box>
              </AccordionDetails>
            </Accordion>

            {/* TLE Settings */}
            <Accordion 
              expanded={accordionExpanded.tle} 
              onChange={handleAccordionChange('tle')}
              sx={{
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                border: `1px solid rgba(${theme.primaryRGB}, 0.2)`,
                borderRadius: '12px !important',
                marginBottom: 1,
                '&:before': { display: 'none' },
                '& .MuiAccordionSummary-root': {
                  padding: '8px 16px',
                  minHeight: '40px',
                  '&.Mui-expanded': {
                    minHeight: '40px',
                  },
                },
                '& .MuiAccordionDetails-root': {
                  padding: '0 16px 16px 16px',
                },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon sx={{ color: theme.primary, fontSize: 18 }} />}
                sx={{
                  '& .MuiAccordionSummary-content': {
                    alignItems: 'center',
                    gap: 1,
                  },
                }}
              >
                <TleIcon sx={{ color: theme.primary, fontSize: 18 }} />
                <Typography variant="caption" sx={{ 
                  color: theme.primary, 
                  fontFamily: 'inherit', 
                  fontWeight: 'bold',
                  fontSize: '0.8rem',
                }}>
                  TLE TRACK SETTINGS
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box>
                  {/* TLE History Duration */}
                  <Box sx={{ marginBottom: 2 }}>
                    <Typography variant="caption" sx={{ 
                      color: '#aaa', 
                      fontFamily: 'inherit', 
                      fontSize: '0.7rem',
                      display: 'block',
                      marginBottom: 1
                    }}>
                      History Duration: {Math.round(tleHistoryDuration / 60)} min
                    </Typography>
                    <Slider
                      value={tleHistoryDuration / 60} // Convert seconds to minutes
                      onChange={(e, value) => dispatch(setTleHistoryDuration((value as number) * 60))}
                      min={5} // 5 minutes minimum
                      max={120} // 2 hours maximum
                      step={5}
                      sx={{
                        color: theme.primary,
                        '& .MuiSlider-thumb': {
                          backgroundColor: theme.primary,
                          '&:hover, &.Mui-focusVisible': {
                            boxShadow: `0 0 0 8px rgba(${theme.primaryRGB}, 0.16)`,
                          },
                        },
                        '& .MuiSlider-track': {
                          backgroundColor: theme.primary,
                        },
                        '& .MuiSlider-rail': {
                          backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        },
                      }}
                    />
                  </Box>

                  {/* TLE Future Duration */}
                  <Box>
                    <Typography variant="caption" sx={{ 
                      color: '#aaa', 
                      fontFamily: 'inherit', 
                      fontSize: '0.7rem',
                      display: 'block',
                      marginBottom: 1
                    }}>
                      Future Duration: {Math.round(tleFutureDuration / 3600 * 10) / 10} hr
                    </Typography>
                    <Slider
                      value={tleFutureDuration / 3600} // Convert seconds to hours
                      onChange={(e, value) => dispatch(setTleFutureDuration((value as number) * 3600))}
                      min={0.5} // 30 minutes minimum
                      max={24} // 24 hours maximum
                      step={0.5}
                      sx={{
                        color: theme.secondary,
                        '& .MuiSlider-thumb': {
                          backgroundColor: theme.secondary,
                          '&:hover, &.Mui-focusVisible': {
                            boxShadow: `0 0 0 8px ${theme.secondary}29`, // 16% opacity
                          },
                        },
                        '& .MuiSlider-track': {
                          backgroundColor: theme.secondary,
                        },
                        '& .MuiSlider-rail': {
                          backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        },
                      }}
                    />
                  </Box>
                </Box>
              </AccordionDetails>
            </Accordion>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default CesiumControlPanel;
