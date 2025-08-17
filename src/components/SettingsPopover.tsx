import React, { useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Popover,
  Box,
  IconButton,
  Typography,
  Slider,
  FormControlLabel,
  Switch,
  Divider,
} from "@mui/material";
import { Settings as SettingsIcon } from "@mui/icons-material";
import { RootState } from "../store";
import { 
  setTleHistoryDuration, 
  setTleFutureDuration,
  setShowCesiumOptions,
  setLiveMode 
} from "../store/mongoSlice";
import { useTheme } from "../contexts/ThemeContext";

const SettingsPopover: React.FC = () => {
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const { 
    tleHistoryDuration, 
    tleFutureDuration,
    showCesiumOptions,
    liveMode 
  } = useSelector((state: RootState) => state.mongo);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? "settings-popover" : undefined;

  // Convert seconds to hours for display
  const historyHours = tleHistoryDuration / 3600;
  const futureHours = tleFutureDuration / 3600;

  const handleHistoryChange = (_: Event, value: number | number[]) => {
    const hours = Array.isArray(value) ? value[0] : value;
    dispatch(setTleHistoryDuration(hours * 3600)); // Convert hours to seconds
  };

  const handleFutureChange = (_: Event, value: number | number[]) => {
    const hours = Array.isArray(value) ? value[0] : value;
    dispatch(setTleFutureDuration(hours * 3600)); // Convert hours to seconds
  };

  const formatHours = (hours: number) => {
    if (hours < 1) {
      const minutes = Math.round(hours * 60);
      return `${minutes}m`;
    } else if (hours === 1) {
      return "1h";
    } else if (hours < 24) {
      return `${hours}h`;
    } else {
      const days = Math.round(hours / 24 * 10) / 10;
      return `${days}d`;
    }
  };

  return (
    <>
      <IconButton
        ref={buttonRef}
        onClick={handleClick}
        sx={{
          color: 'rgba(var(--theme-primary-rgb), 0.8)',
          backgroundColor: 'rgba(var(--theme-primary-rgb), 0.1)',
          border: '1px solid rgba(var(--theme-primary-rgb), 0.2)',
          borderRadius: '8px',
          width: '36px',
          height: '36px',
          transition: 'all 0.3s ease',
          backdropFilter: 'blur(10px)',
          '&:hover': {
            backgroundColor: 'rgba(var(--theme-primary-rgb), 0.2)',
            borderColor: 'rgba(var(--theme-primary-rgb), 0.4)',
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 16px rgba(var(--theme-primary-rgb), 0.3)',
          },
        }}
      >
        <SettingsIcon sx={{ fontSize: 18 }} />
      </IconButton>

      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        PaperProps={{
          sx: {
            background: `linear-gradient(135deg, 
              rgba(var(--theme-primary-rgb), 0.1) 0%, 
              rgba(var(--theme-primary-rgb), 0.05) 100%)`,
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(var(--theme-primary-rgb), 0.2)',
            borderRadius: '12px',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.3)',
            minWidth: '300px',
            maxWidth: '400px',
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography
            variant="h6"
            sx={{
              color: 'var(--theme-primary)',
              fontWeight: 600,
              mb: 2,
              textShadow: 'var(--theme-text-shadow)',
            }}
          >
            TLE Track Settings
          </Typography>

          {/* History Duration */}
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="body2"
              sx={{
                color: 'rgba(var(--theme-primary-rgb), 0.9)',
                mb: 1,
                fontWeight: 500,
              }}
            >
              History Trail: {formatHours(historyHours)}
            </Typography>
            <Slider
              value={historyHours}
              onChange={handleHistoryChange}
              min={0.25} // 15 minutes
              max={48} // 2 days
              step={0.25}
              marks={[
                { value: 0.5, label: '30m' },
                { value: 2, label: '2h' },
                { value: 6, label: '6h' },
                { value: 24, label: '1d' },
              ]}
              sx={{
                color: 'var(--theme-primary)',
                '& .MuiSlider-thumb': {
                  backgroundColor: 'var(--theme-primary)',
                  border: '2px solid rgba(var(--theme-primary-rgb), 0.5)',
                },
                '& .MuiSlider-track': {
                  backgroundColor: 'var(--theme-primary)',
                },
                '& .MuiSlider-rail': {
                  backgroundColor: 'rgba(var(--theme-primary-rgb), 0.3)',
                },
                '& .MuiSlider-mark': {
                  backgroundColor: 'rgba(var(--theme-primary-rgb), 0.5)',
                },
                '& .MuiSlider-markLabel': {
                  color: 'rgba(var(--theme-primary-rgb), 0.7)',
                  fontSize: '0.7rem',
                },
              }}
            />
          </Box>

          {/* Future Duration */}
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="body2"
              sx={{
                color: 'rgba(var(--theme-primary-rgb), 0.9)',
                mb: 1,
                fontWeight: 500,
              }}
            >
              Future Projection: {formatHours(futureHours)}
            </Typography>
            <Slider
              value={futureHours}
              onChange={handleFutureChange}
              min={0.5} // 30 minutes
              max={72} // 3 days
              step={0.25}
              marks={[
                { value: 1, label: '1h' },
                { value: 6, label: '6h' },
                { value: 12, label: '12h' },
                { value: 24, label: '1d' },
                { value: 48, label: '2d' },
              ]}
              sx={{
                color: 'var(--theme-primary)',
                '& .MuiSlider-thumb': {
                  backgroundColor: 'var(--theme-primary)',
                  border: '2px solid rgba(var(--theme-primary-rgb), 0.5)',
                },
                '& .MuiSlider-track': {
                  backgroundColor: 'var(--theme-primary)',
                },
                '& .MuiSlider-rail': {
                  backgroundColor: 'rgba(var(--theme-primary-rgb), 0.3)',
                },
                '& .MuiSlider-mark': {
                  backgroundColor: 'rgba(var(--theme-primary-rgb), 0.5)',
                },
                '& .MuiSlider-markLabel': {
                  color: 'rgba(var(--theme-primary-rgb), 0.7)',
                  fontSize: '0.7rem',
                },
              }}
            />
          </Box>

          <Divider sx={{ borderColor: 'rgba(var(--theme-primary-rgb), 0.2)', mb: 2 }} />

          {/* Additional Settings */}
          <Typography
            variant="h6"
            sx={{
              color: 'var(--theme-primary)',
              fontWeight: 600,
              mb: 2,
              textShadow: 'var(--theme-text-shadow)',
            }}
          >
            Display Settings
          </Typography>

          <FormControlLabel
            control={
              <Switch
                checked={showCesiumOptions}
                onChange={(e) => dispatch(setShowCesiumOptions(e.target.checked))}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: 'var(--theme-primary)',
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: 'var(--theme-primary)',
                  },
                }}
              />
            }
            label={
              <Typography
                variant="body2"
                sx={{ color: 'rgba(var(--theme-primary-rgb), 0.9)' }}
              >
                Show Cesium Controls
              </Typography>
            }
          />

          <FormControlLabel
            control={
              <Switch
                checked={liveMode}
                onChange={(e) => dispatch(setLiveMode(e.target.checked))}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: 'var(--theme-primary)',
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: 'var(--theme-primary)',
                  },
                }}
              />
            }
            label={
              <Typography
                variant="body2"
                sx={{ color: 'rgba(var(--theme-primary-rgb), 0.9)' }}
              >
                Live Mode
              </Typography>
            }
          />
        </Box>
      </Popover>
    </>
  );
};

export default SettingsPopover;
