import React from "react";
import {
  Drawer,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Button,
} from "@mui/material";

interface LeftNavDrawerProps {
  drawerOpen: boolean;
  onClose: () => void;
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

const LeftNavDrawer: React.FC<LeftNavDrawerProps> = ({
  drawerOpen,
  onClose,
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
  return (
    <Drawer anchor="left" open={drawerOpen} onClose={onClose}>
      <Box style={{ width: 280, padding: 16 }}>
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
          <Select value={selectedSatId} onChange={(e) => setSelectedSatId(e.target.value)}>
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
            control={<Checkbox checked={showTle} onChange={(e) => setShowTle(e.target.checked)} />}
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
      </Box>
    </Drawer>
  );
};

export default LeftNavDrawer;