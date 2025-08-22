import React, { useEffect, useMemo, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchContactWindows,
  selectContactWindows,
} from "../store/contactWindowsSlice";
import { AppDispatch } from "../store";
import "./GlobeTools.css";
import SatellitePopover from "./SatellitePopover";
import GroundStationPopover from "./GroundStationPopover";
import ContactWindowsPopover from "./ContactWindowsPopover";
import ConsolePopover from "./ConsolePopover";
import { ContactWindow } from "../types";
import { useTheme } from "../contexts/ThemeContext";
import { useSelectedEntities } from "../hooks/useSelectedEntities";
import { getContactWindowsPopoverProps } from "../utils/popoverUtils";
import { Box } from "@mui/material";
import { DragIndicator as DragIndicatorIcon } from "@mui/icons-material";

interface GlobeToolsProps {
  groundStations: any[];
  debugInfo: any;
}

const GlobeTools: React.FC<GlobeToolsProps> = ({
  debugInfo,
}) => {
  const dispatch = useDispatch<AppDispatch>();
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
  const contactWindowsStatus = useSelector((state: any) => state.contactWindows.status);

  // React to changes in selectedSatelliteId - debounced to prevent excessive API calls
  useEffect(() => {
    if (selectedSatelliteId && selectedGroundStationId) {
      const timeoutId = setTimeout(() => {
        // Only fetch if we don't already have contact windows for this pair
        const hasData = contactWindows.some((win: ContactWindow) => 
          win.satelliteId === selectedSatelliteId.replace('api-', '') && 
          win.groundStationId === selectedGroundStationId.replace('api-', '')
        );
        
        // Only fetch if we don't have data and not currently loading
        if (!hasData && contactWindowsStatus !== "loading") {
          console.log(`GlobeTools: Fetching contact windows for satellite ${selectedSatelliteId} and ground station ${selectedGroundStationId}`);
          dispatch(
            fetchContactWindows({
              satelliteId: selectedSatelliteId,
              groundStationId: selectedGroundStationId,
            })
          );
        }
      }, 500); // Increased debounce to 500ms

      return () => clearTimeout(timeoutId);
    }
  }, [selectedSatelliteId, selectedGroundStationId, dispatch, contactWindows, contactWindowsStatus]); // Added contactWindows as dependency

  // Remove the duplicate fetch effect to prevent double API calls

  // Calculate the next contact window - throttled to prevent constant re-renders
  const nextContactWindow: ContactWindow | null = useMemo(() => {
    if (
      !selectedSatelliteId ||
      !selectedGroundStationId ||
      !debugInfo.currentTime
    )
      return null;

    const cesiumCurrentTime = debugInfo.currentTime;
    
    // Throttle updates to every 5 seconds to reduce constant re-calculations
    const throttledTime = Math.floor(cesiumCurrentTime.getTime() / 5000) * 5000;

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
    Math.floor((debugInfo.currentTime?.getTime() || 0) / 5000), // Throttle to every 5 seconds
  ]);

  // Drag functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only start dragging if not clicking on buttons or interactive elements
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[role="button"]') || target.closest('.popover-trigger')) {
      return;
    }

    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
    e.preventDefault();
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Add global event listeners for drag
  useEffect(() => {
    const handleMouseMoveCallback = (e: MouseEvent) => {
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

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMoveCallback);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMoveCallback);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMoveCallback);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, dragStart.x, dragStart.y]);

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
        {/* Drag Handle */}
        <DragIndicatorIcon 
          sx={{ 
            color: 'rgba(var(--theme-primary-rgb), 0.5)', 
            fontSize: 16,
            cursor: 'grab',
            opacity: 0.7,
            marginRight: '6px',
            '&:hover': {
              opacity: 1,
              color: 'var(--theme-primary)',
            }
          }} 
        />
        
        {/* Existing Tool Groups */}
        <SatellitePopover />
        <GroundStationPopover />
        <ContactWindowsPopover 
          {...getContactWindowsPopoverProps(
            selectedSatelliteId,
            selectedGroundStationId,
            selectedSatellite,
            selectedGroundStation,
            nextContactWindow,
            undefined // Don't pass currentTime to prevent constant re-renders
          )}
        />
        <ConsolePopover debugInfo={debugInfo} nextContactWindow={nextContactWindow} />
      </div>
    </Box>
  );
};

export default GlobeTools;
