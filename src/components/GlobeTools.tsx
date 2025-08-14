import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchContactWindows,
  selectContactWindows,
} from "../store/contactWindowsSlice";
import { AppDispatch, RootState } from "../store";
import "./GlobeTools.css";
import SatellitePopover from "./SatellitePopover"; // Import the SatellitePopover component
import GroundStationPopover from "./GroundStationPopover"; // Import the GroundStationPopover component
import ContactWindowsPopover from "./ContactWindowsPopover"; // Import the ContactWindowsPopover component
import ConsolePopover from "./ConsolePopover"; // Import the ConsolePopover component
import { ContactWindow } from "../types";
import { useTheme } from "../contexts/ThemeContext";
import { Box } from "@mui/material";

interface GlobeToolsProps {
  groundStations: any[];
  debugInfo: any;
}

const GlobeTools: React.FC<GlobeToolsProps> = ({
  debugInfo,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { theme } = useTheme();
  const selectedSatelliteId = useSelector(
    (state: RootState) => state.mongo.selectedSatId
  ); // Retrieve selected satellite ID
  const selectedGroundStationId = useSelector(
    (state: RootState) => state.mongo.selectedGroundStationId
  ); // Retrieve selected ground station ID

  // Get satellites and ground stations data to find names
  const { satellites, groundStations } = useSelector((state: RootState) => state.mongo);
  
  // Find the selected satellite and ground station names
  const selectedSatellite = satellites.find((sat: any) => sat._id === selectedSatelliteId);
  const selectedGroundStation = groundStations.find((gs: any) => gs._id === selectedGroundStationId);

  // Retrieve contact windows from Redux
  const contactWindows = useSelector(selectContactWindows);

  // React to changes in selectedSatelliteId
  useEffect(() => {
    if (selectedSatelliteId) {
      console.log(`Selected Satellite ID: ${selectedSatelliteId}`);
      // Example: Fetch data or update UI based on the selected satellite
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

  return (
    <Box
      className="globe-tools"
      sx={{
        position: 'absolute',
        top: '80px',
        left: '20px',
        background: 'rgba(10, 15, 25, 0.85)',
        backdropFilter: 'blur(20px)',
        border: `1px solid rgba(${theme.primaryRGB}, 0.3)`,
        borderRadius: '20px',
        boxShadow: `
          0 16px 50px rgba(${theme.primaryRGB}, 0.2),
          inset 0 1px 0 rgba(255, 255, 255, 0.1),
          0 0 40px rgba(${theme.primaryRGB}, 0.15)
        `,
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        fontFamily: "'Courier New', Courier, monospace",
        minWidth: 'fit-content',
        zIndex: 1000,
        '&:hover': {
          transform: 'scale(1.02)',
          boxShadow: `
            0 25px 80px rgba(${theme.primaryRGB}, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.1),
            0 0 40px rgba(${theme.primaryRGB}, 0.25)
          `,
          borderColor: `rgba(${theme.primaryRGB}, 0.5)`,
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: '20px',
          padding: '1px',
          background: `linear-gradient(
            45deg,
            ${theme.primary},
            rgba(${theme.primaryRGB}, 0.3),
            ${theme.primary}
          )`,
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'exclude',
          opacity: 0,
          transition: 'opacity 0.4s ease',
        },
        '&:hover::before': {
          opacity: 1,
        },
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
        <div className="globe-tools-group">
          {/* Satellite Popover */}
          <SatellitePopover />

          {/* Ground Station Popover */}
          <GroundStationPopover />

          {/* Contact Windows Popover */}
          {selectedSatelliteId && selectedGroundStationId && satellites.length > 0 && groundStations.length > 0 && (
            <ContactWindowsPopover
              key={`${selectedSatelliteId}-${selectedGroundStationId}-${selectedSatellite?.name || 'unknown'}`}
              satelliteId={selectedSatelliteId}
              groundStationId={selectedGroundStationId}
              satelliteName={selectedSatellite?.name || "Unknown Satellite"}
              groundStationName={selectedGroundStation?.name || "Unknown Ground Station"}
            />
          )}
          {(!selectedSatelliteId || !selectedGroundStationId) && (
            <ContactWindowsPopover
              satelliteId={selectedSatelliteId || ''}
              groundStationId={selectedGroundStationId || ''}
              showPlaceholder={true}
            />
          )}
        </div>

        <div className="globe-tools-divider"></div>

        <div className="globe-tools-group">
          {/* Console Popover */}
          <ConsolePopover
            debugInfo={debugInfo}
            nextContactWindow={nextContactWindow}
          />
        </div>
      </div>
    </Box>
  );
};

export default GlobeTools;
