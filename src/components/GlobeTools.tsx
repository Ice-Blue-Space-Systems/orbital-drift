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
import CesiumOptionsPopover from "./CesiumOptionsPopover"; // Import the CesiumOptionsPopover component
import { ContactWindow } from "../types";

interface GlobeToolsProps {
  groundStations: any[];
  debugInfo: any;
}

const GlobeTools: React.FC<GlobeToolsProps> = ({
  debugInfo,
}) => {
  const dispatch = useDispatch<AppDispatch>();
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

    const futureWindows = contactWindows.filter(
      (win: ContactWindow) =>
        win.satelliteId === selectedSatelliteId &&
        win.groundStationId === selectedGroundStationId &&
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
    <div className="globe-tools">
      {/* Globe Tools Button Container */}
      <div className="globe-tools-buttons">
        <div className="globe-tools-group">
          {/* Satellite Popover */}
          <SatellitePopover />

          {/* Ground Station Popover */}
          <GroundStationPopover />

          {/* Contact Windows Popover */}
          {selectedSatelliteId && selectedGroundStationId && (
            <ContactWindowsPopover
              satelliteId={selectedSatelliteId}
              groundStationId={selectedGroundStationId}
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

          {/* Cesium Options Popover */}
          <CesiumOptionsPopover />
        </div>
      </div>
    </div>
  );
};

export default GlobeTools;
