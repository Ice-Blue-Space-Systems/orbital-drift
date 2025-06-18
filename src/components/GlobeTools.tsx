import React, { useEffect, useState, useMemo } from "react";
import {
  IconButton,
  Tooltip,
} from "@mui/material";
import CodeIcon from "@mui/icons-material/Code"; // Import Console icon
import SettingsIcon from "@mui/icons-material/Settings"; // Import Settings icon
import { useDispatch, useSelector } from "react-redux";
import {
  fetchContactWindows,
  selectContactWindows,
} from "../store/contactWindowsSlice";
import { AppDispatch } from "../store";
import SatelliteStatusTable from "./SatelliteStatusTable";
import DockableComponent from "./DockableComponent";
import "./GlobeTools.css";
import { ContactWindow } from "../store/mongoSlice";
import SatellitePopover from "./SatellitePopover"; // Import the SatellitePopover component
import GroundStationPopover from "./GroundStationPopover"; // Import the GroundStationPopover component
import ContactWindowsPopover from "./ContactWindowsPopover"; // Import the ContactWindowsPopover component
import ConsolePopover from "./ConsolePopover"; // Import the ConsolePopover component
import CesiumOptionsPopover from "./CesiumOptionsPopover"; // Import the CesiumOptionsPopover component

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
  showCesiumOptions: boolean; // Add this prop
  setShowCesiumOptions: (value: boolean) => void; // Add this prop
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
  showCesiumOptions,
  setShowCesiumOptions,
}) => {
  const dispatch = useDispatch<AppDispatch>();

  // Retrieve contact windows from Redux
  const contactWindows = useSelector(selectContactWindows);

  // State to track which popover is open
  const [openPopover, setOpenPopover] = useState<
    | "groundStation"
    | "toolbox"
    | "contactWindow"
    | "console"
    | "cesiumOptions"
    | null
  >(null);

  // Fetch contact windows when satellite or ground station changes
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

  // Calculate the next contact window
  const nextContactWindow: ContactWindow | null = useMemo(() => {
    if (!selectedSatId || !selectedGroundStationId || !debugInfo.currentTime)
      return null;

    // Convert Cesium clock's currentTime (JulianDate) to a JavaScript Date
    const cesiumCurrentTime = debugInfo.currentTime;

    const futureWindows = contactWindows.filter(
      (win: ContactWindow) =>
        win.satelliteId === selectedSatId &&
        win.groundStationId === selectedGroundStationId &&
        new Date(win.scheduledLOS) > cesiumCurrentTime // Compare against Cesium clock time
    );

    if (!futureWindows.length) return null;

    // Sort by AOS and return the first one
    return futureWindows.sort(
      (a: ContactWindow, b: ContactWindow) =>
        new Date(a.scheduledAOS).getTime() - new Date(b.scheduledAOS).getTime()
    )[0];
  }, [
    contactWindows,
    selectedSatId,
    selectedGroundStationId,
    debugInfo.currentTime,
  ]);

  // Determine the active page and calculate the arrow's position
  const currentPath = window.location.pathname;
  const arrowPosition =
    {
      "/globe": "28px", // Position under the PublicIcon button
      "/timeline": "92px", // Adjust based on the Timeline button's position
      "/sats": "156px", // Adjust based on the Satellite button's position
      "/gs": "220px", // Adjust based on the Ground Station button's position
    }[currentPath] || "16px"; // Default to Globe if no match

  return (
    <div
      style={{
        position: "absolute",
        borderTop: "1px solid #00ff00", // Green top border
        top: "64px", // Position just below the top navigation bar
        left: "0px", // Align to the left
        backgroundColor: "rgba(50, 50, 50, 0.3)", // Transparent space-grey background
        // borderRadius: "8px", // Rounded corners
        padding: "12px", // Add padding around the buttons
        zIndex: 1000, // Ensure it appears above other elements
        boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)", // Subtle shadow for depth
      }}
    >
      {/* Green Arrow */}
      <div
        style={{
          position: "absolute",
          top: "-8px", // Position above the Globe Tools panel
          left: arrowPosition, // Dynamically position the arrow
          width: "0",
          height: "0",
          borderLeft: "8px solid transparent",
          borderRight: "8px solid transparent",
          borderBottom: "8px solid #00ff00", // Green arrow
          zIndex: 1001, // Ensure it appears above the panel
        }}
      ></div>

      {/* Satellite, Ground Station, Toolbox, and Contact Windows Buttons */}
      <div
        style={{
          display: "flex",
          gap: "16px", // Space between buttons
        }}
      >
        {/* Satellite Button */}
        <SatellitePopover
          satellites={satellites}
          selectedSatId={selectedSatId}
          setSelectedSatId={setSelectedSatId}
          showTle={showTle}
          setShowTle={setShowTle}
          showHistory={showHistory}
          setShowHistory={setShowHistory}
          showGroundTrack={showGroundTrack}
          setShowGroundTrack={setShowGroundTrack}
        />

        {/* Ground Station Button */}
        <GroundStationPopover
          groundStations={groundStations}
          selectedGroundStationId={selectedGroundStationId}
          setSelectedGroundStationId={setSelectedSatId}
          showLineOfSight={showLineOfSight}
          setShowLineOfSight={setShowLineOfSight}
          showVisibilityCones={showVisibilityCones}
          setShowVisibilityCones={setShowVisibilityCones}
        />

        {/* Contact Windows Button */}
        {selectedSatId && selectedGroundStationId && (
          <ContactWindowsPopover
            satelliteId={selectedSatId}
            groundStationId={selectedGroundStationId}
          />
        )}

        {/* Console Button */}
        <ConsolePopover
          debugInfo={debugInfo}
          groundStations={groundStations}
          satellites={satellites}
          selectedSatId={selectedSatId}
          selectedGroundStationId={selectedGroundStationId}
          satPositionProperty={satPositionProperty}
          tleHistoryRef={tleHistoryRef}
          groundTrackHistoryRef={groundTrackHistoryRef}
          nextContactWindow={nextContactWindow}
        />

        {/* Cesium Options Button */}
        <CesiumOptionsPopover
          showCesiumOptions={showCesiumOptions}
          setShowCesiumOptions={setShowCesiumOptions}
        />
      </div>
    </div>
  );
};

export default GlobeTools;
