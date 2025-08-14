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
import TimelinePopover from "./TimelinePopover";
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
    if (selectedSatelliteId && contactWindowsStatus !== "loading") {
      const timeoutId = setTimeout(() => {
        console.log(`Selected Satellite ID: ${selectedSatelliteId}`);
        dispatch(
          fetchContactWindows({
            satelliteId: selectedSatelliteId,
            groundStationId: selectedGroundStationId || "",
          })
        );
      }, 200); // 200ms debounce

      return () => clearTimeout(timeoutId);
    }
  }, [selectedSatelliteId, selectedGroundStationId, dispatch, contactWindowsStatus]);

  // Remove the duplicate fetch effect to prevent double API calls

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
            debugInfo.currentTime
          )}
        />
        <ConsolePopover debugInfo={debugInfo} nextContactWindow={nextContactWindow} />
        <TimelinePopover />
      </div>
    </Box>
  );
};

export default GlobeTools;
