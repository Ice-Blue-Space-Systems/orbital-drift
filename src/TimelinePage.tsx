import React, { useEffect, useRef, useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { DataSet } from "vis-data";
import { Timeline } from "vis-timeline/standalone";
import "vis-timeline/styles/vis-timeline-graph2d.min.css";
import { selectContactWindows } from "./store/contactWindowsSlice";
import TimelineTools from "./components/TimelineTools";
import { AppDispatch } from "./store"; // Import AppDispatch type
import "./components/TimelineTools.css"; // Ensure the CSS file is imported
import { fetchMongoData } from "./store/mongoSlice";

const TimelinePage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  // State for satellites and ground stations
  const { satellites, groundStations, status } = useSelector((state: any) => state.mongo);

  // State for selected satellite and ground station
  const [selectedSatId, setSelectedSatId] = useState<string>("");
  const [selectedGroundStationId, setSelectedGroundStationId] = useState<string>("");

  // State for additional props required by TimelineTools
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [showTle, setShowTle] = useState<boolean>(false);
  const [showLineOfSight, setShowLineOfSight] = useState<boolean>(false);
  const [showVisibilityCones, setShowVisibilityCones] = useState<boolean>(false);
  const [showGroundTrack, setShowGroundTrack] = useState<boolean>(false);
  const [showCesiumOptions, setShowCesiumOptions] = useState<boolean>(false);

  // State for timeline controls
  const timelineRef = useRef<HTMLDivElement>(null);
  const timelineInstance = useRef<Timeline | null>(null);

  // Refs for TLE and ground track history
  const tleHistoryRef = useRef<any[]>([]);
  const groundTrackHistoryRef = useRef<any[]>([]);

  // Get contact windows data from Redux
  const contactWindows = useSelector(selectContactWindows);

  // Fetch initial data once
  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchMongoData());
    }
  }, [status, dispatch]);

  // Calculate the next contact window
  const nextContactWindow = useMemo(() => {
    const now = new Date();
    const futureWindows = contactWindows.filter(
      (win: { scheduledAOS: string | number | Date; scheduledLOS: string | number | Date }) =>
        new Date(win.scheduledAOS) > now
    );

    if (futureWindows.length === 0) return null;

    // Sort by AOS and return the first one
    return futureWindows.sort(
      (a: any, b: any) =>
        new Date(a.scheduledAOS).getTime() - new Date(b.scheduledAOS).getTime()
    )[0];
  }, [contactWindows]);

  // Initialize the timeline
  useEffect(() => {
    if (!timelineRef.current) return;

    const container = timelineRef.current;
    const items = new DataSet([]);
    const options = {
      start: new Date(),
      end: new Date(Date.now() + 3600 * 1000), // 1 hour from now
      showCurrentTime: true, // Show the current time indicator
      zoomMin: 1000 * 60, // Minimum zoom level (1 minute)
      zoomMax: 1000 * 60 * 60 * 24, // Maximum zoom level (1 day)
    };

    timelineInstance.current = new Timeline(container, items, options);

    return () => {
      if (timelineInstance.current) {
        timelineInstance.current.destroy();
      }
    };
  }, []);

  // Update the timeline when contact windows change
  useEffect(() => {
    if (!timelineInstance.current) return;

    // Map contact windows to timeline items
    const items = contactWindows.map(
      (win: { scheduledAOS: string | number | Date; scheduledLOS: string | number | Date }, index: number) => ({
        id: index,
        content: `<div style="background-color: rgba(50, 50, 50, 0.9); color: #00ff00; padding: 4px; border-radius: 4px;">
                    Contact Window ${index + 1}
                  </div>`,
        start: new Date(win.scheduledAOS),
        end: new Date(win.scheduledLOS),
      })
    );

    const dataSet = new DataSet(items);
    timelineInstance.current.setItems(dataSet as any);
  }, [contactWindows]);

  // Timeline control functions
  const jumpToNextContactWindow = () => {
    if (!timelineInstance.current || !nextContactWindow) return;

    // Focus on the next contact window
    timelineInstance.current.setWindow(
      new Date(nextContactWindow.scheduledAOS),
      new Date(nextContactWindow.scheduledLOS),
      { animation: true }
    );

    // Center the timeline on the next contact window
    timelineInstance.current.moveTo(new Date(nextContactWindow.scheduledAOS), { animation: true });
  };

  const jumpToStart = () => {
    if (!timelineInstance.current) return;

    timelineInstance.current.setWindow(
      new Date(contactWindows[0]?.scheduledAOS || Date.now()),
      new Date(contactWindows[0]?.scheduledLOS || Date.now() + 3600 * 1000),
      { animation: true }
    );
  };

  const jumpToNow = () => {
    if (!timelineInstance.current) return;

    // Move to the current time
    timelineInstance.current.moveTo(new Date(), { animation: true });
  };

  const zoomIn = () => {
    if (!timelineInstance.current) return;
    timelineInstance.current.zoomIn(0.5);
  };

  const zoomOut = () => {
    if (!timelineInstance.current) return;
    timelineInstance.current.zoomOut(0.5);
  };

  const fitAllWindows = () => {
    if (!timelineInstance.current) return;
    timelineInstance.current.fit({ animation: true });
  };

  return (
    <div
      style={{
        height: "100vh",
        backgroundColor: "black", // Set the entire page background to black
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Timeline Tools */}
      <div className="timeline-tools-container">
        <div className="timeline-tools-arrow"></div> {/* Add the arrow */}
        <TimelineTools
          onJumpToNext={jumpToNextContactWindow}
          onJumpToStart={jumpToStart}
          onJumpToNow={jumpToNow}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onFitAll={fitAllWindows}
          satellites={satellites}
          groundStations={groundStations}
          selectedSatId={selectedSatId}
          setSelectedSatId={setSelectedSatId}
          selectedGroundStationId={selectedGroundStationId}
          setSelectedGroundStationId={setSelectedGroundStationId}
          showTle={showTle}
          setShowTle={setShowTle}
          showHistory={showHistory}
          setShowHistory={setShowHistory}
          showGroundTrack={showGroundTrack}
          setShowGroundTrack={setShowGroundTrack}
          showLineOfSight={showLineOfSight}
          setShowLineOfSight={setShowLineOfSight}
          showVisibilityCones={showVisibilityCones}
          setShowVisibilityCones={setShowVisibilityCones}
          debugInfo={timelineInstance.current} // Pass timeline instance as debugInfo
          satPositionProperty={null} // Placeholder for satellite position property
          tleHistoryRef={tleHistoryRef}
          groundTrackHistoryRef={groundTrackHistoryRef}
          nextContactWindow={nextContactWindow}
          showCesiumOptions={showCesiumOptions}
          setShowCesiumOptions={setShowCesiumOptions}
        />
      </div>

      {/* Timeline container */}
      <div
        ref={timelineRef}
        style={{
          flex: 1,
          marginTop: "120px", // Push the timeline down to avoid overlap with tools
          height: "80vh", // Increase the height of the timeline
          backgroundColor: "rgba(0, 0, 0, 0.8)", // Transparent black background
        }}
      />
    </div>
  );
};

export default TimelinePage;