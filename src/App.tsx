import React from 'react';
import { ToastContainer } from 'react-toastify';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, IconButton, Typography } from '@mui/material';
import PublicIcon from '@mui/icons-material/Public';
import TimelineIcon from '@mui/icons-material/Timeline';
import SatelliteIcon from '@mui/icons-material/SatelliteAlt';
import RadarIcon from '@mui/icons-material/Radar';

import CesiumDashboard from './CesiumDashboard';
import TimelinePage from './TimelinePage';
import SatsPage from './SatsPage';
import GSPage from './GSPage';

/** A simple top nav with the four route icons. */
function GlobalAppBar() {
  const navigate = useNavigate();

  return (
    <AppBar position="static" style={{ backgroundColor: '#2b2b2b' }}>
      <Toolbar>
        <IconButton color="inherit" onClick={() => navigate('/globe')}>
          <PublicIcon />
        </IconButton>
        <IconButton color="inherit" onClick={() => navigate('/timeline')}>
          <TimelineIcon />
        </IconButton>
        <IconButton color="inherit" onClick={() => navigate('/sats')}>
          <SatelliteIcon />
        </IconButton>
        <IconButton color="inherit" onClick={() => navigate('/gs')}>
          <RadarIcon />
        </IconButton>

        <Typography variant="h6" style={{ flexGrow: 1, marginLeft: '1rem' }}>
          My App
        </Typography>
      </Toolbar>
    </AppBar>
  );
}

const App: React.FC = () => {
  return (
    <div>
      <ToastContainer />
      <Router>
        {/* We render the global nav bar once, at the top */}
        <GlobalAppBar />
        {/* Define routes for the entire app */}
        <Routes>
          {/* Default to the Globe (CesiumDashboard) */}
          <Route path="/" element={<Navigate to="/globe" replace />} />
          <Route path="/globe" element={<CesiumDashboard />} />
          <Route path="/timeline" element={<TimelinePage />} />
          <Route path="/sats" element={<SatsPage />} />
          <Route path="/gs" element={<GSPage />} />
        </Routes>
      </Router>
    </div>
  );
};

export default App;