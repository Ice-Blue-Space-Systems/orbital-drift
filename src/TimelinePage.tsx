import React, { useEffect, useRef } from "react";
import { DataSet } from "vis-data";
import { Timeline } from "vis-timeline/standalone";
import "vis-timeline/styles/vis-timeline-graph2d.min.css";

interface TimelinePageProps {
  contactWindows: {
    satelliteId: string;
    groundStationId: string;
    scheduledAOS: string | Date;
    scheduledLOS: string | Date;
  }[];
  selectedSatId: string;
  selectedGroundStationId: string;
}

const TimelinePage: React.FC<TimelinePageProps> = ({
  contactWindows,
  selectedSatId,
  selectedGroundStationId,
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const timelineInstance = useRef<Timeline | null>(null);

  useEffect(() => {
    if (!timelineRef.current) return;

    // Initialize the timeline
    const container = timelineRef.current;
    const items = new DataSet([]);
    const options = {
      start: new Date(),
      end: new Date(Date.now() + 3600 * 1000), // 1 hour from now
      showCurrentTime: true,
      zoomMin: 1000 * 60, // Minimum zoom level (1 minute)
      zoomMax: 1000 * 60 * 60 * 24, // Maximum zoom level (1 day)
    };

    timelineInstance.current = new Timeline(container, items, options);

    return () => {
      // Cleanup timeline instance
      if (timelineInstance.current) {
        timelineInstance.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (!timelineInstance.current) return;

    // Filter contact windows for the selected satellite and ground station
    const filteredWindows = contactWindows.filter(
      (win) =>
        win.satelliteId === selectedSatId &&
        win.groundStationId === selectedGroundStationId
    );

    // Map contact windows to timeline items
    const items = filteredWindows.map((win, index) => ({
      id: index,
      content: `Contact Window ${index + 1}`,
      start: new Date(win.scheduledAOS),
      end: new Date(win.scheduledLOS),
    }));

    // Update the timeline items
    const dataSet = new DataSet(items);
    timelineInstance.current.setItems(dataSet);
  }, [contactWindows, selectedSatId, selectedGroundStationId]);

  return (
    <div style={{ padding: "16px" }}>
      <h1 style={{ color: "#00ff00" }}>Timeline</h1>
      <div ref={timelineRef} style={{ height: "300px" }} />
    </div>
  );
};

export default TimelinePage;