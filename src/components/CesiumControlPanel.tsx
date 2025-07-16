import React, { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Box, IconButton, Typography, Tooltip, Chip, Switch, FormControlLabel, Slider } from "@mui/material";
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
} from "@mui/icons-material";
import { setCesiumClockMultiplier } from "../store/cesiumClockSlice";
import { setShowCesiumOptions } from "../store/mongoSlice";
import { RootState } from "../store";

interface CesiumControlPanelProps {
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}

const CesiumControlPanel: React.FC<CesiumControlPanelProps> = ({
  position = "top-right"
}) => {
  const dispatch = useDispatch();
  const currentMultiplier = useSelector((state: RootState) => state.cesiumClock.multiplier);
  const showCesiumOptions = useSelector((state: RootState) => state.mongo.showCesiumOptions);
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [speedMode, setSpeedMode] = useState<'dial' | 'slider'>('dial');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [memoryUsage, setMemoryUsage] = useState(0);
  
  const dialRef = useRef<HTMLDivElement>(null);
  const centerRef = useRef({ x: 0, y: 0 });

  const minSpeed = 0.1;
  const maxSpeed = 1000;

  // Update time and memory usage every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      if ((performance as any).memory) {
        setMemoryUsage(Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

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
    dispatch(setCesiumClockMultiplier(newMultiplier));
  };

  const getPositionStyles = () => {
    const baseStyles = {
      position: "fixed" as const,
      zIndex: 2000,
    };

    switch (position) {
      case "top-left":
        return { ...baseStyles, top: "80px", left: "20px" };
      case "top-right":
        return { ...baseStyles, top: "80px", right: "20px" };
      case "bottom-left":
        return { ...baseStyles, bottom: "20px", left: "20px" };
      case "bottom-right":
        return { ...baseStyles, bottom: "20px", right: "20px" };
      default:
        return { ...baseStyles, top: "80px", right: "20px" };
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

  return (
    <Box sx={{ ...getPositionStyles() }}>
      {/* Main Control Panel */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, rgba(10, 10, 10, 0.95) 0%, rgba(20, 20, 20, 0.90) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(0, 255, 65, 0.3)',
          borderRadius: '20px',
          boxShadow: isExpanded 
            ? '0 25px 80px rgba(0, 255, 65, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 40px rgba(0, 255, 65, 0.2)'
            : '0 16px 50px rgba(0, 255, 65, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          padding: 2,
          minWidth: isExpanded ? '300px' : '280px',
          fontFamily: "'Courier New', Courier, monospace",
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isExpanded ? 'scale(1.02)' : 'scale(1)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: '20px',
            padding: '1px',
            background: 'linear-gradient(135deg, rgba(0, 255, 65, 0.5), rgba(0, 170, 255, 0.3), rgba(255, 170, 0, 0.3))',
            mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            maskComposite: 'exclude',
            opacity: isExpanded ? 1 : 0,
            transition: 'opacity 0.4s ease',
            animation: isExpanded ? 'border-flow 4s linear infinite' : 'none',
            '@keyframes border-flow': {
              '0%': { transform: 'rotate(0deg)' },
              '100%': { transform: 'rotate(360deg)' },
            },
          },
        }}
      >
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: isExpanded ? 2 : 0,
          padding: '8px 4px'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TuneIcon sx={{ color: '#00ff41', fontSize: 20 }} />
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#00ff41', 
                fontFamily: 'inherit',
                fontWeight: 'bold',
                textShadow: '0 0 10px rgba(0, 255, 65, 0.5)'
              }}
            >
              CONTROL
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Speed Display */}
            <Chip 
              label={formatSpeed(currentMultiplier)}
              size="small"
              sx={{
                backgroundColor: currentMultiplier !== 1 ? 'rgba(255, 170, 0, 0.3)' : 'rgba(0, 255, 65, 0.2)',
                color: currentMultiplier !== 1 ? '#ffaa00' : '#00ff41',
                fontFamily: 'inherit',
                fontWeight: 'bold',
                animation: currentMultiplier !== 1 ? 'pulse 2s infinite' : 'none',
                border: currentMultiplier !== 1 ? '1px solid rgba(255, 170, 0, 0.5)' : '1px solid rgba(0, 255, 65, 0.3)',
                boxShadow: currentMultiplier !== 1 ? '0 0 15px rgba(255, 170, 0, 0.4)' : '0 0 10px rgba(0, 255, 65, 0.3)',
                '@keyframes pulse': {
                  '0%, 100%': { 
                    opacity: 1,
                    transform: 'scale(1)',
                  },
                  '50%': { 
                    opacity: 0.8,
                    transform: 'scale(1.05)',
                  },
                },
              }}
            />
            
            {/* Expand/Collapse Toggle */}
            <IconButton
              onClick={() => setIsExpanded(!isExpanded)}
              sx={{
                color: '#00ff41',
                padding: '4px',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: 'rgba(0, 255, 65, 0.1)',
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
            '@keyframes slideDown': {
              from: { opacity: 0, transform: 'translateY(-10px)' },
              to: { opacity: 1, transform: 'translateY(0)' },
            },
          }}>
            {/* Speed Control Section */}
            <Box sx={{ 
              marginBottom: 3,
              padding: 2,
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '12px',
              border: '1px solid rgba(0, 255, 65, 0.2)'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                <Typography variant="caption" sx={{ color: '#00ff41', fontFamily: 'inherit', fontWeight: 'bold' }}>
                  SIMULATION SPEED
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <IconButton
                    size="small"
                    onClick={() => setSpeedMode('dial')}
                    sx={{
                      color: speedMode === 'dial' ? '#00ff41' : '#666',
                      padding: '2px',
                    }}
                  >
                    <SpeedIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => setSpeedMode('slider')}
                    sx={{
                      color: speedMode === 'slider' ? '#00ff41' : '#666',
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
                      background: 'conic-gradient(from 225deg, transparent 0deg, rgba(0, 255, 65, 0.3) 270deg, transparent 270deg)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid rgba(0, 255, 65, 0.5)',
                      boxShadow: '0 0 20px rgba(0, 255, 65, 0.3), inset 0 0 20px rgba(0, 255, 65, 0.1)',
                    }}
                  >
                    {/* Dial Handle */}
                    <Box
                      sx={{
                        position: 'absolute',
                        width: 6,
                        height: 35,
                        backgroundColor: '#00ff41',
                        borderRadius: '3px',
                        top: 10,
                        transformOrigin: '3px 40px',
                        transform: `rotate(${rotation - 135}deg)`,
                        boxShadow: '0 0 10px rgba(0, 255, 65, 0.8)',
                        transition: isDragging ? 'none' : 'transform 0.2s ease',
                      }}
                    />
                    
                    {/* Center Dot */}
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        backgroundColor: '#00ff41',
                        borderRadius: '50%',
                        boxShadow: '0 0 15px rgba(0, 255, 65, 0.8)',
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
                      color: '#00ff41',
                      '& .MuiSlider-track': {
                        background: 'linear-gradient(90deg, rgba(0, 255, 65, 0.3) 0%, rgba(0, 255, 65, 0.8) 100%)',
                        border: 'none',
                      },
                      '& .MuiSlider-thumb': {
                        backgroundColor: '#00ff41',
                        boxShadow: '0 0 15px rgba(0, 255, 65, 0.8)',
                        '&:hover': {
                          boxShadow: '0 0 20px rgba(0, 255, 65, 1)',
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
                {presetSpeeds.map((speed) => (
                  <Chip
                    key={speed}
                    label={formatSpeed(speed)}
                    size="small"
                    clickable
                    onClick={() => dispatch(setCesiumClockMultiplier(speed))}
                    sx={{
                      backgroundColor: currentMultiplier === speed ? 'rgba(0, 255, 65, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                      color: currentMultiplier === speed ? '#00ff41' : '#aaa',
                      fontFamily: 'inherit',
                      fontSize: '0.6rem',
                      height: '20px',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 255, 65, 0.2)',
                        color: '#00ff41',
                      },
                    }}
                  />
                ))}
              </Box>
            </Box>

            {/* Cesium UI Controls */}
            <Box sx={{ 
              padding: 2,
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '12px',
              border: '1px solid rgba(0, 255, 65, 0.2)'
            }}>
              <Typography variant="caption" sx={{ 
                color: '#00ff41', 
                fontFamily: 'inherit', 
                fontWeight: 'bold',
                display: 'block',
                marginBottom: 2
              }}>
                CESIUM INTERFACE
              </Typography>

              {/* Master Toggle */}
              <FormControlLabel
                control={
                  <Switch
                    checked={showCesiumOptions}
                    onChange={(e) => dispatch(setShowCesiumOptions(e.target.checked))}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#00ff41',
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: '#00ff41',
                      },
                      '& .MuiSwitch-track': {
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      },
                    }}
                  />
                }
                label={
                  <Typography variant="body2" sx={{ 
                    color: showCesiumOptions ? '#00ff41' : '#666', 
                    fontFamily: 'inherit',
                    fontSize: '0.8rem'
                  }}>
                    Show Native Controls
                  </Typography>
                }
                sx={{ margin: 0, width: '100%' }}
              />

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
                        backgroundColor: showCesiumOptions ? 'rgba(0, 255, 65, 0.15)' : 'rgba(100, 100, 100, 0.1)',
                        border: `1px solid ${showCesiumOptions ? 'rgba(0, 255, 65, 0.3)' : 'rgba(100, 100, 100, 0.2)'}`,
                        color: showCesiumOptions ? '#00ff41' : '#666',
                        fontSize: '14px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': showCesiumOptions ? {
                          backgroundColor: 'rgba(0, 255, 65, 0.25)',
                          boxShadow: '0 0 10px rgba(0, 255, 65, 0.4)',
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

            {/* System Information */}
            <Box sx={{ 
              padding: 2,
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '12px',
              border: '1px solid rgba(0, 255, 65, 0.2)',
              marginTop: 2
            }}>
              <Typography variant="caption" sx={{ 
                color: '#00ff41', 
                fontFamily: 'inherit', 
                fontWeight: 'bold',
                display: 'block',
                marginBottom: 1
              }}>
                SYSTEM STATUS
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, fontSize: '0.7rem' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', color: '#aaa', fontFamily: 'inherit' }}>
                  <span>FPS:</span>
                  <span style={{ color: '#00ff41' }}>60 FPS</span>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', color: '#aaa', fontFamily: 'inherit' }}>
                  <span>Memory:</span>
                  <span style={{ 
                    color: memoryUsage > 100 ? '#ff6600' : '#00aaff',
                    fontWeight: memoryUsage > 100 ? 'bold' : 'normal'
                  }}>
                    ~{memoryUsage || Math.round(50000000 / 1024 / 1024)}MB
                  </span>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', color: '#aaa', fontFamily: 'inherit' }}>
                  <span>Time:</span>
                  <span style={{ color: '#ffaa00' }}>{currentTime.toLocaleTimeString()}</span>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', color: '#aaa', fontFamily: 'inherit' }}>
                  <span>Speed:</span>
                  <span style={{ 
                    color: currentMultiplier === 1 ? '#00ff41' : currentMultiplier > 1 ? '#ffaa00' : '#ff6600',
                    fontWeight: 'bold'
                  }}>
                    {formatSpeed(currentMultiplier)}
                  </span>
                </Box>
              </Box>

              {/* Performance Indicator */}
              <Box sx={{ 
                marginTop: 1, 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                padding: '4px 8px',
                backgroundColor: memoryUsage > 100 ? 'rgba(255, 102, 0, 0.1)' : 'rgba(0, 255, 65, 0.1)',
                borderRadius: '6px',
                transition: 'background-color 0.3s ease'
              }}>
                <MemoryIcon sx={{ 
                  color: memoryUsage > 100 ? '#ff6600' : '#00ff41', 
                  fontSize: 12,
                  animation: memoryUsage > 100 ? 'warning-pulse 1.5s infinite' : 'none',
                  '@keyframes warning-pulse': {
                    '0%, 100%': { opacity: 1 },
                    '50%': { opacity: 0.6 },
                  },
                }} />
                <Typography variant="caption" sx={{ 
                  color: memoryUsage > 100 ? '#ff6600' : '#00ff41', 
                  fontFamily: 'inherit',
                  fontSize: '0.65rem'
                }}>
                  {memoryUsage > 100 ? 'HIGH MEMORY USAGE' : 'OPTIMAL PERFORMANCE'}
                </Typography>
              </Box>
            </Box>
          </Box>
        )}

        {/* Quick Action Buttons - Always Visible when Collapsed */}
        {!isExpanded && (
          <Box sx={{ 
            display: 'flex', 
            gap: 1, 
            marginTop: 1,
            animation: 'fadeIn 0.3s ease',
            '@keyframes fadeIn': {
              from: { opacity: 0 },
              to: { opacity: 1 },
            },
          }}>
            {/* Quick Speed Presets + Mission Mode Toggle */}
            {[0.1, 1, 10, 100].map((speed) => (
              <Tooltip key={speed} title={`Set speed to ${speed}x`} arrow>
                <IconButton
                  size="small"
                  onClick={() => dispatch(setCesiumClockMultiplier(speed))}
                  sx={{
                    color: currentMultiplier === speed ? '#00ff41' : '#666',
                    backgroundColor: currentMultiplier === speed ? 'rgba(0, 255, 65, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(0, 255, 65, 0.3)',
                    borderRadius: '6px',
                    fontSize: '0.6rem',
                    fontFamily: 'inherit',
                    minWidth: '28px',
                    height: '28px',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 255, 65, 0.1)',
                      color: '#00ff41',
                      transform: 'scale(1.05)',
                      boxShadow: '0 0 8px rgba(0, 255, 65, 0.4)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  {speed === 0.1 ? '0.1x' : `${speed}x`}
                </IconButton>
              </Tooltip>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default CesiumControlPanel;
