import React, { useEffect, useState } from 'react';
import {
  IconButton,
  Tooltip,
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import SatelliteIcon from '@mui/icons-material/SatelliteAlt';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RadarIcon from '@mui/icons-material/Radar';
import PublicIcon from '@mui/icons-material/Public';
import AntennaIcon from '@mui/icons-material/SettingsInputAntenna'; // Ground station antenna icon
import BuildIcon from '@mui/icons-material/Build'; // Toolbox icon
import EventIcon from '@mui/icons-material/Event'; // Import an icon for the Contact Windows button
import { useDispatch } from 'react-redux';
import { fetchContactWindows } from '../store/contactWindowsSlice';
import { AppDispatch } from '../store';
import SatelliteStatusTable from './SatelliteStatusTable';

interface GlobeToolsProps {
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

  debugInfo: any; // Pass debugInfo for SatelliteStatusTable
  satPositionProperty: any;
  tleHistoryRef: React.MutableRefObject<any[]>;
  groundTrackHistoryRef: React.MutableRefObject<any[]>;
  onViewContactWindows: () => void;
}

const GlobeTools: React.FC<GlobeToolsProps> = ({
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
  debugInfo,
  satPositionProperty,
  tleHistoryRef,
  groundTrackHistoryRef,
  onViewContactWindows,
}) => {
  const dispatch = useDispatch<AppDispatch>();

  // State to track which popover is open
  const [openPopover, setOpenPopover] = useState<'satellite' | 'groundStation' | 'toolbox' | null>(null);
  const [satelliteFilter, setSatelliteFilter] = useState('');
  const [groundStationFilter, setGroundStationFilter] = useState('');

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

  const filteredSatellites = satellites.filter((sat) =>
    sat.name.toLowerCase().includes(satelliteFilter.toLowerCase())
  );

  const filteredGroundStations = groundStations.filter((gs) =>
    gs.name.toLowerCase().includes(groundStationFilter.toLowerCase())
  );

  const iconStyle = (active: boolean): React.CSSProperties => ({
    color: active ? '#00ff00' : '#888888', // Brighter green for active, noticeable gray for inactive
  });

  return (
    <div style={{ position: 'relative' }}>
      {/* Satellite, Ground Station, and Toolbox Buttons */}
      <div
        style={{
          position: 'absolute', // Float above the globe
          top: '64px', // Adjust to be below the navigation bar
          left: '16px', // Adjust to align with the left edge
          display: 'flex',
          gap: '16px',
          zIndex: 1000, // Ensure it appears above other elements
        }}
      >
        {/* Satellite Button */}
        <div
          style={{ position: 'relative' }}
          onMouseEnter={() => setOpenPopover('satellite')}
          onMouseLeave={() => setOpenPopover(null)}
        >
          <Tooltip title="Select Satellite" arrow>
            <IconButton
              style={{
                color: selectedSatId ? '#00ff00' : '#888888', // Brighter green for selected, gray otherwise
              }}
            >
              <SatelliteIcon />
            </IconButton>
          </Tooltip>

          {/* Satellite Popover */}
          {openPopover === 'satellite' && (
            <div
              style={{
                position: 'absolute',
                top: '48px', // Position below the button
                left: '0',
                backgroundColor: 'rgba(13, 13, 13, 0.9)', // Console-style dark background
                border: '1px solid #00ff00', // Green border
                color: '#00ff00', // Green text
                fontFamily: 'Courier New, Courier, monospace', // Console-style font
                borderRadius: '4px',
                padding: '8px',
                width: '200px',
                zIndex: 1001,
              }}
            >
              {/* Arrow */}
              <div
                style={{
                  position: 'absolute',
                  top: '-8px',
                  left: '16px',
                  width: '0',
                  height: '0',
                  borderLeft: '8px solid transparent',
                  borderRight: '8px solid transparent',
                  borderBottom: '8px solid #00ff00', // Green arrow
                }}
              ></div>

              {/* Filter and List */}
              <TextField
                fullWidth
                placeholder="Filter Satellites"
                value={satelliteFilter}
                onChange={(e) => setSatelliteFilter(e.target.value)}
                style={{
                  marginBottom: '8px',
                  backgroundColor: '#1e1e1e', // Slightly lighter background for input
                  color: '#00ff00',
                }}
                InputProps={{
                  style: { color: '#00ff00' }, // Green text for input
                }}
              />
              <List>
                {filteredSatellites.map((sat) => (
                  <ListItem key={sat._id} disablePadding>
                    <ListItemButton
                      onClick={() => {
                        setSelectedSatId(sat._id);
                        setOpenPopover(null); // Close popover after selection
                      }}
                      style={{ color: '#00ff00' }}
                    >
                      <ListItemText primary={sat.name} />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </div>
          )}
        </div>

        {/* Ground Station Button */}
        <div
          style={{ position: 'relative' }}
          onMouseEnter={() => setOpenPopover('groundStation')}
          onMouseLeave={() => setOpenPopover(null)}
        >
          <Tooltip title="Select Ground Station" arrow>
            <IconButton
              style={{
                color: selectedGroundStationId ? '#00ff00' : '#888888', // Brighter green for selected, gray otherwise
              }}
            >
              <AntennaIcon />
            </IconButton>
          </Tooltip>

          {/* Ground Station Popover */}
          {openPopover === 'groundStation' && (
            <div
              style={{
                position: 'absolute',
                top: '48px', // Position below the button
                left: '0',
                backgroundColor: 'rgba(13, 13, 13, 0.9)', // Console-style dark background
                border: '1px solid #00ff00', // Green border
                color: '#00ff00', // Green text
                fontFamily: 'Courier New, Courier, monospace', // Console-style font
                borderRadius: '4px',
                padding: '8px',
                width: '200px',
                zIndex: 1001,
              }}
            >
              {/* Arrow */}
              <div
                style={{
                  position: 'absolute',
                  top: '-8px',
                  left: '16px',
                  width: '0',
                  height: '0',
                  borderLeft: '8px solid transparent',
                  borderRight: '8px solid transparent',
                  borderBottom: '8px solid #00ff00', // Green arrow
                }}
              ></div>

              {/* Filter and List */}
              <TextField
                fullWidth
                placeholder="Filter Ground Stations"
                value={groundStationFilter}
                onChange={(e) => setGroundStationFilter(e.target.value)}
                style={{
                  marginBottom: '8px',
                  backgroundColor: '#1e1e1e', // Slightly lighter background for input
                  color: '#00ff00',
                }}
                InputProps={{
                  style: { color: '#00ff00' }, // Green text for input
                }}
              />
              <List>
                {filteredGroundStations.map((gs) => (
                  <ListItem key={gs._id} disablePadding>
                    <ListItemButton
                      onClick={() => {
                        setSelectedGroundStationId(gs._id);
                        setOpenPopover(null); // Close popover after selection
                      }}
                      style={{ color: '#00ff00' }}
                    >
                      <ListItemText primary={gs.name} />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </div>
          )}
        </div>

        {/* Toolbox Button */}
        <div style={{ position: 'relative' }}>
          <Tooltip title="Toggle Toolbox" arrow>
            <IconButton
              onClick={() =>
                setOpenPopover(openPopover === 'toolbox' ? null : 'toolbox')
              }
              style={{
                color: selectedSatId || selectedGroundStationId ? '#00ff00' : '#555555',
              }}
            >
              <BuildIcon />
            </IconButton>
          </Tooltip>

          {/* Toolbox Popover */}
          {openPopover === 'toolbox' && (
            <div
              style={{
                position: 'absolute',
                top: '48px', // Position below the button
                left: '0',
                backgroundColor: 'rgba(13, 13, 13, 0.9)', // Console-style dark background
                border: '1px solid #00ff00', // Green border
                color: '#00ff00', // Green text
                fontFamily: 'Courier New, Courier, monospace', // Console-style font
                borderRadius: '4px',
                padding: '8px',
                width: '350px', // Match the original toolbox width
                zIndex: 1001,
              }}
            >
              {/* Arrow */}
              <div
                style={{
                  position: 'absolute',
                  top: '-8px',
                  left: '16px',
                  width: '0',
                  height: '0',
                  borderLeft: '8px solid transparent',
                  borderRight: '8px solid transparent',
                  borderBottom: '8px solid #00ff00', // Green arrow
                }}
              ></div>

              {/* Toolbox Content */}
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {/* Icon toggles row */}
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '8px' }}>
                  <div style={{ color: showHistory ? '#00ff00' : '#555555' }}>
                    <IconButton
                      onClick={() => setShowHistory(!showHistory)}
                      title="Toggle History"
                    >
                      <HistoryIcon />
                    </IconButton>
                  </div>

                  <div style={{ color: showTle ? '#00ff00' : '#555555' }}>
                    <IconButton onClick={() => setShowTle(!showTle)} title="Toggle TLE">
                      <SatelliteIcon />
                    </IconButton>
                  </div>

                  <div style={{ color: showLineOfSight ? '#00ff00' : '#555555' }}>
                    <IconButton
                      onClick={() => setShowLineOfSight(!showLineOfSight)}
                      title="Toggle Line of Sight"
                    >
                      <VisibilityIcon />
                    </IconButton>
                  </div>

                  <div style={{ color: showVisibilityCones ? '#00ff00' : '#555555' }}>
                    <IconButton
                      onClick={() => setShowVisibilityCones(!showVisibilityCones)}
                      title="Toggle Visibility Cones"
                    >
                      <RadarIcon />
                    </IconButton>
                  </div>

                  <div style={{ color: showGroundTrack ? '#00ff00' : '#555555' }}>
                    <IconButton
                      onClick={() => setShowGroundTrack(!showGroundTrack)}
                      title="Toggle Ground Track"
                    >
                      <PublicIcon />
                    </IconButton>
                  </div>
                </div>

                {/* Satellite Status Table */}
                <SatelliteStatusTable
                  debugInfo={debugInfo}
                  groundStations={groundStations}
                  satellites={satellites}
                  selectedSatId={selectedSatId}
                  selectedGroundStationId={selectedGroundStationId}
                  satPositionProperty={satPositionProperty}
                  tleHistoryRef={tleHistoryRef}
                  groundTrackHistoryRef={groundTrackHistoryRef}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contact Windows Icon Button */}
      {selectedSatId && selectedGroundStationId && (
        <div
          style={{
            position: 'absolute',
            top: '120px',
            left: '16px',
            zIndex: 1000,
          }}
        >
          <Tooltip title="View Contact Windows" arrow>
            <IconButton
              onClick={onViewContactWindows}
              style={{
                color: '#00ff00', // Bright green to make it visible
              }}
            >
              <EventIcon />
            </IconButton>
          </Tooltip>
        </div>
      )}
    </div>
  );
};

export default GlobeTools;