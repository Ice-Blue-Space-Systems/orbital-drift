import React, { useEffect, useMemo, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  fetchContactWindows,
  selectContactWindows,
} from "../store/contactWindowsSlice";
import { AppDispatch, RootState } from "../store";
import "./GlobeTools.css";
import SatellitePopover from "./SatellitePopover";
import GroundStationPopover from "./GroundStationPopover";
import ContactWindowsPopover from "./ContactWindowsPopover";
import ConsolePopover from "./ConsolePopover";
import { ContactWindow } from "../types";
import { useTheme } from "../contexts/ThemeContext";
import { useSelectedEntities } from "../hooks/useSelectedEntities";
import { getContactWindowsPopoverProps } from "../utils/popoverUtils";
import { Box, IconButton, Tooltip } from "@mui/material";
import TimelineIcon from "@mui/icons-material/Timeline";

interface GlobeToolsProps {
  groundStations: any[];
  debugInfo: any;
}

const GlobeTools: React.FC<GlobeToolsProps> = ({
  debugInfo,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const globeToolsRef = useRef<HTMLDivElement>(null);
  
  // Use shared hook for selected entities
  const {
    selectedSatelliteId,
    selectedGroundStationId,
    selectedSatellite,
    selectedGroundStation,
  } = useSelectedEntities();
  
  // State for dragging
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Retrieve contact windows from Redux
  const contactWindows = useSelector(selectContactWindows);

  // React to changes in selectedSatelliteId
  useEffect(() => {
    if (selectedSatelliteId) {
      console.log(`Selected Satellite ID: ${selectedSatelliteId}`);
      dispatch(
        fetchContactWindows({
          satelliteId: selectedSatelliteId,
          groundStationId: selectedGroundStationId || "",
        })
      );
    }
  }, [selectedSatelliteId, selectedGroundStationId, dispatch]);

  // Fetch contact windows when satellite or ground station changes
  useEffect(() => {
    if (selectedSatelliteId && selectedGroundStationId) {
      dispatch(
        fetchContactWindows({
          satelliteId: selectedSatelliteId,
          groundStationId: selectedGroundStationId,
        })
      );
    }
  }, [selectedSatelliteId, selectedGroundStationId, dispatch]);

  // Calculate the next contact window
  const nextContactWindow: ContactWindow | null = useMemo(() => {
    if (
      !selectedSatelliteId ||
      !selectedGroundStationId ||
      !debugInfo.currentTime
    )
      return null;

    const cesiumCurrentTime = debugInfo.currentTime;

    // Extract real MongoDB ObjectIds from synthetic IDs
    let realSatId = selectedSatelliteId;
    let realGroundStationId = selectedGroundStationId;

    if (selectedSatelliteId.startsWith('api-')) {
      realSatId = selectedSatelliteId.replace('api-', '');
    }

    if (selectedGroundStationId.startsWith('api-')) {
      realGroundStationId = selectedGroundStationId.replace('api-', '');
    }

    // For predefined ground stations, there are no contact windows in the database
    if (selectedGroundStationId.startsWith('predefined-')) {
      return null;
    }

    const futureWindows = contactWindows.filter(
      (win: ContactWindow) =>
        win.satelliteId === realSatId &&
        win.groundStationId === realGroundStationId &&
        new Date(win.scheduledLOS) > cesiumCurrentTime
    );

    if (!futureWindows.length) return null;

    return futureWindows.sort(
      (a: ContactWindow, b: ContactWindow) =>
        new Date(a.scheduledAOS).getTime() - new Date(b.scheduledAOS).getTime()
    )[0];
  }, [
    contactWindows,
    selectedSatelliteId,
    selectedGroundStationId,
    debugInfo.currentTime,
  ]);

  // Navigation handlers
  const handlePlannerClick = () => {
    navigate('/timeline');
  };

  // Drag functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      
      // Constrain to viewport bounds
      const maxX = window.innerWidth - (globeToolsRef.current?.offsetWidth || 200);
      const maxY = window.innerHeight - (globeToolsRef.current?.offsetHeight || 100);
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Add global event listeners for drag
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, dragStart]);

  return (
    <Box
      ref={globeToolsRef}
      className="globe-tools"
      onMouseDown={handleMouseDown}
      sx={{
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? 'grabbing' : 'grab',
        // CSS Custom Properties for the CSS file to use
        '--theme-primary': theme.primary,
        '--theme-primary-rgb': theme.primaryRGB,
        '--theme-background': theme.background,
        '--theme-card-background': theme.cardBackground,
        '--theme-glow-color': theme.glowColor,
        '--theme-text-shadow': theme.textShadow,
      }}
    >
      {/* Globe Tools Button Container */}
      <div className="globe-tools-buttons">
        {/* Existing Tool Groups */}
        <SatellitePopover />
        
        <div className="globe-tools-divider"></div>
        
        <GroundStationPopover />
        
        <div className="globe-tools-divider"></div>
        
        <ContactWindowsPopover 
          {...getContactWindowsPopoverProps(
            selectedSatelliteId,
            selectedGroundStationId,
            selectedSatellite,
            selectedGroundStation,
            nextContactWindow,
            debugInfo.currentTime
          )}
        />
        
        <div className="globe-tools-divider"></div>
        
        <ConsolePopover debugInfo={debugInfo} nextContactWindow={nextContactWindow} />
        
        <div className="globe-tools-divider"></div>

        {/* Navigation Group - Mission Planner (last) */}
        <div className="globe-tools-group">
          <Tooltip title="Mission Planner" arrow>
            <IconButton
              className="icon-button"
              onClick={handlePlannerClick}
              sx={{ color: 'inherit' }}
            >
              <TimelineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </div>
      </div>
    </Box>
  );
};

export default GlobeTools;
