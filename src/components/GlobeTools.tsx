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
