import React, { useEffect } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Button,
  Typography,
  IconButton
} from '@mui/material';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useDispatch } from 'react-redux';

import { fetchContactWindows } from '../store/contactWindowsSlice';
import { AppDispatch } from '../store';

interface CesiumOptionsProps {
  // We remove isOpen/onClose for a simpler approach
  showToolbox: boolean;
  setShowToolbox: React.Dispatch<React.SetStateAction<boolean>>;

  groundStations: any[];
  satellites: any[];
  selectedGroundStationId: string;
  selectedSatId: string;
  setSelectedGroundStationId: (id: string) => void;
  setSelectedSatId: (id: string) => void;
  showHistory: boolean;
  setShowHistory: (value: boolean) => void;
  showTle: boolean;
  setShowTle: (value: boolean) => void;
  showLineOfSight: boolean;
  setShowLineOfSight: (value: boolean) => void;
  showVisibilityCones: boolean;
  setShowVisibilityCones: (value: boolean) => void;
  showGroundTrack: boolean;
  setShowGroundTrack: (value: boolean) => void;
  showStatusTable: boolean;
  setShowStatusTable: (value: boolean) => void;
  onViewContactWindows: () => void;
}

const CesiumOptions: React.FC<CesiumOptionsProps> = ({
  showToolbox,
  setShowToolbox,
  groundStations,
  satellites,
  selectedGroundStationId,
  selectedSatId,
  setSelectedGroundStationId,
  setSelectedSatId,
  showHistory,
  setShowHistory,
  showTle,
  setShowTle,
  showLineOfSight,
  setShowLineOfSight,
  showVisibilityCones,
  setShowVisibilityCones,
  showGroundTrack,
  setShowGroundTrack,
  showStatusTable,
  setShowStatusTable,
  onViewContactWindows,
}) => {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    if (selectedSatId && selectedGroundStationId) {
      dispatch(
        fetchContactWindows({
          satelliteId: selectedSatId,
          groundStationId: selectedGroundStationId,
        })
      );
    }
  }, [selectedSatId, selectedGroundStationId, dispatch]);

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    right: 0,
    top: 64,
    width: 300,
    backgroundColor: '#fff',
    borderLeft: '1px solid #ccc',
    zIndex: 999,
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.5rem 1rem',
    borderBottom: '1px solid #ccc',
    cursor: 'pointer',
  };

  const bodyStyle: React.CSSProperties = {
    padding: '1rem',
    display: showToolbox ? 'block' : 'none',
    overflowY: 'auto',
    maxHeight: 'calc(100vh - 64px - 40px)',
  };

  return (
    <Box style={containerStyle}>
      <div style={headerStyle} onClick={() => setShowToolbox(!showToolbox)}>
        <Typography variant="subtitle1">Cesium Toolbox</Typography>
        <IconButton size="small" onClick={() => setShowToolbox(!showToolbox)}>
          {showToolbox ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </div>

      <div style={bodyStyle}>
        <FormControl size="small" fullWidth>
          <InputLabel>Ground Station</InputLabel>
          <Select
            value={selectedGroundStationId}
            onChange={(e) => setSelectedGroundStationId(e.target.value)}
          >
            {groundStations.map((gs) => (
              <MenuItem key={gs._id} value={gs._id}>
                {gs.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" fullWidth style={{ marginTop: 16 }}>
          <InputLabel>Satellite</InputLabel>
          <Select
            value={selectedSatId}
            onChange={(e) => setSelectedSatId(e.target.value)}
          >
            {satellites.map((sat) => (
              <MenuItem key={sat._id} value={sat._id}>
                {sat.name} ({sat.type})
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormGroup style={{ marginTop: 16 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={showHistory}
                onChange={(e) => setShowHistory(e.target.checked)}
              />
            }
            label="Show History"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={showTle}
                onChange={(e) => setShowTle(e.target.checked)}
              />
            }
            label="Show TLE"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={showLineOfSight}
                onChange={(e) => setShowLineOfSight(e.target.checked)}
              />
            }
            label="Show Line of Sight"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={showVisibilityCones}
                onChange={(e) => setShowVisibilityCones(e.target.checked)}
              />
            }
            label="Show Visibility Cones"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={showGroundTrack}
                onChange={(e) => setShowGroundTrack(e.target.checked)}
              />
            }
            label="Show Ground Track"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={showStatusTable}
                onChange={(e) => setShowStatusTable(e.target.checked)}
              />
            }
            label="Show Debug"
          />
        </FormGroup>

        {selectedSatId && selectedGroundStationId && (
          <Button
            variant="contained"
            onClick={onViewContactWindows}
            style={{ marginTop: 16 }}
          >
            View Contact Windows
          </Button>
        )}
      </div>
    </Box>
  );
};

export default CesiumOptions;