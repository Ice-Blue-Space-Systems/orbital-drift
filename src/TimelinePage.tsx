import React, { useEffect, useRef, useMemo } from "react";
import { useSelector } from "react-redux";
import { DataSet } from "vis-data";
import { Timeline } from "vis-timeline/standalone";
import "vis-timeline/styles/vis-timeline-graph2d.min.css";
import {
  selectContactWindows,
  selectContactWindowsStatus,
  selectContactWindowsError,
} from "./store/contactWindowsSlice";
import TimelineTools from "./components/TimelineTools";
import "./components/TimelineTools.css"; // Ensure the CSS file is imported
import { ContactWindow } from "./store/mongoSlice";

const TimelinePage: React.FC = () => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const timelineInstance = useRef<Timeline | null>(null);

  // Get contact windows data, status, and error from Redux
  const contactWindows = useSelector(selectContactWindows);
  const status = useSelector(selectContactWindowsStatus);
  const error = useSelector(selectContactWindowsError);

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
      (a: ContactWindow, b: ContactWindow) =>
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
        content: `Contact Window ${index + 1}`,
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
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Timeline Tools */}
      <div className="timeline-tools-container">
        <TimelineTools
          onJumpToNext={jumpToNextContactWindow}
          onJumpToStart={jumpToStart}
          onJumpToNow={jumpToNow}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onFitAll={fitAllWindows}
        />
      </div>

      {/* Timeline container */}
      <div
        ref={timelineRef}
        style={{
          flex: 1,
          marginTop: "120px", // Push the timeline down to avoid overlap with tools
          backgroundColor: "rgba(0, 0, 0, 0.8)", // Transparent black background
          border: "1px solid #00ff00", // Bright green border
          borderRadius: "4px",
        }}
      />
    </div>
  );
};

export default TimelinePage;