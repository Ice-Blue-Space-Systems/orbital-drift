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
        top: '64px',
        left: 0,
        background: `linear-gradient(180deg, ${theme.cardBackground} 0%, rgba(0, 0, 0, 0.7) 50%, transparent 100%)`,
        borderTop: `3px solid ${theme.primary}`,
        borderLeft: 'none',
        borderRight: 'none',
        borderBottom: 'none',
        borderRadius: 0,
        boxShadow: `0 4px 20px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(${theme.primaryRGB}, 0.2)`,
        transition: 'all 0.3s ease-in-out',
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
          <ContactWindowsPopover
            satelliteId={selectedSatelliteId || ''}
            groundStationId={selectedGroundStationId || ''}
            showPlaceholder={!selectedSatelliteId || !selectedGroundStationId}
          />
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
