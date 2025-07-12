import React, { useEffect, useRef, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { DataSet } from "vis-data";
import { Timeline } from "vis-timeline/standalone";
import "vis-timeline/styles/vis-timeline-graph2d.min.css";
import { selectContactWindows } from "./store/contactWindowsSlice";
import { selectCesiumClockUtc } from "./store/selectors/cesiumClockSelectors";
import TimelineTools from "./components/TimelineTools";
import { AppDispatch } from "./store";
import "./components/TimelineTools.css";
import { fetchMongoData } from "./store/mongoSlice";
import { GroundStation, Satellite } from "./types";
import { transformContactWindowsToTimelineItems } from "./utils/timelineUtils";

const TimelinePage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  // State for satellites and ground stations
  const { satellites, groundStations, status } = useSelector((state: any) => state.mongo);
  const selectedSatelliteId = useSelector((state: any) => state.mongo.selectedSatId);
  const selectedGroundStationId = useSelector((state: any) => state.mongo.selectedGroundStationId);

  // Find the selected satellite and ground station
  const selectedSatellite = satellites.find((sat: Satellite) => sat._id === selectedSatelliteId);
  const selectedGroundStation = groundStations.find(
    (gs: GroundStation) => gs._id === selectedGroundStationId
  );

  // State for timeline controls
  const timelineRef = useRef<HTMLDivElement>(null);
  const timelineInstance = useRef<Timeline | null>(null);


  // Get contact windows data from Redux
  const contactWindows = useSelector(selectContactWindows);
  
  // Get Cesium clock time and multiplier (single source of truth)
  const cesiumClockTime = useSelector(selectCesiumClockUtc);
  const cesiumMultiplier = useSelector((state: any) => state.cesiumClock.multiplier);

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
      end: new Date(Date.now() + 3600 * 1000),
      showCurrentTime: true,
      zoomMin: 1000 * 60,
      zoomMax: 1000 * 60 * 60 * 24,
    };

    timelineInstance.current = new Timeline(container, items, options);

    // Enable dragging for the current time bar
    const handleDrag = (event: MouseEvent) => {
      if (!timelineInstance.current) return;

      const timelineBounds = container.getBoundingClientRect();
      const timelineWidth = timelineBounds.width;

      // Calculate the new time based on the mouse position
      const mouseX = event.clientX - timelineBounds.left;
      const percentage = mouseX / timelineWidth;
      const newTime = new Date(
        timelineInstance.current.getWindow().start.getTime() +
          percentage *
            (timelineInstance.current.getWindow().end.getTime() -
              timelineInstance.current.getWindow().start.getTime())
      );

      timelineInstance.current.setCurrentTime(newTime);
    };

    const handleMouseDown = (event: MouseEvent) => {
      if (event.target && (event.target as HTMLElement).classList.contains("vis-current-time")) {
        document.addEventListener("mousemove", handleDrag);
        document.addEventListener("mouseup", () => {
          document.removeEventListener("mousemove", handleDrag);
        });
      }
    };

    container.addEventListener("mousedown", handleMouseDown);

    return () => {
      container.removeEventListener("mousedown", handleMouseDown);
      if (timelineInstance.current) {
        timelineInstance.current.destroy();
      }
    };
  }, []);

  // Update the timeline when contact windows change
  useEffect(() => {
    if (!timelineInstance.current) return;

    // Transform contact windows into timeline items using the utility function
    const items = transformContactWindowsToTimelineItems(contactWindows);

    const dataSet = new DataSet(items);
    timelineInstance.current.setItems(dataSet as any);
  }, [contactWindows]);

  // Sync timeline current time with Cesium clock time (single source of truth)
  useEffect(() => {
    if (!timelineInstance.current || !cesiumClockTime) return;

    try {
      const currentTime = new Date(cesiumClockTime);
      timelineInstance.current.setCurrentTime(currentTime);
      
      // Log occasionally to show timeline is syncing
      if (Math.random() < 0.02) { // Log ~2% of updates
        console.log(`TimelinePage: Syncing to time: ${cesiumClockTime} (Speed: ${cesiumMultiplier}x)`);
      }
    } catch (error) {
      console.error("TimelinePage: Error parsing Cesium clock time", error);
    }
  }, [cesiumClockTime, cesiumMultiplier]); // Depend on both time and multiplier since both are used

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
      {/* Container for TimelineTools and Label */}
      <div style={{ position: "relative" }}>
        {/* Timeline Tools */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0 }}>
          <TimelineTools
            onJumpToNext={jumpToNextContactWindow}
            onJumpToStart={jumpToStart}
            onJumpToNow={jumpToNow}
            onZoomIn={zoomIn}
            onZoomOut={zoomOut}
            onFitAll={fitAllWindows}
            debugInfo={timelineInstance.current} // Pass timeline instance as debugInfo
            nextContactWindow={nextContactWindow}
          />
        </div>

        {/* Selected Satellite and Ground Station Label */}
        <div
          style={{
            marginTop: "85px", // Push the label below the toolbar
            textAlign: "center",
            color: "#00ff00",
            fontFamily: "Courier New, Courier, monospace",
          }}
        >
          <div>
            <strong>Selected Satellite:</strong>{" "}
            {selectedSatellite ? selectedSatellite.name : "None"}
          </div>
          <div>
            <strong>Selected Ground Station:</strong>{" "}
            {selectedGroundStation ? selectedGroundStation.name : "None"}
          </div>
          <div style={{ marginTop: "8px", fontSize: "12px", color: "#ffff00" }}>
            <strong>Simulation Speed:</strong> {cesiumMultiplier}x
            {cesiumMultiplier !== 1 && " (Synced with Cesium)"}
          </div>
        </div>
      </div>

      {/* Timeline container */}
      <div
        ref={timelineRef}
        style={{
          flex: 1,
          marginTop: "16px",
          height: "80vh",
          backgroundColor: "rgba(0, 0, 0, 0.8)",
        }}
      />
    </div>
  );
};

export default TimelinePage;