import React, { useEffect, useRef, useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { DataSet } from "vis-data";
import { Timeline } from "vis-timeline/standalone";
import "vis-timeline/styles/vis-timeline-graph2d.min.css";
import "./components/TimelineStyles.css"; // Custom timeline styling
import { selectContactWindows } from "./store/contactWindowsSlice";
import { selectCesiumClockUtc } from "./store/selectors/cesiumClockSelectors";
import TimelineTools from "./components/TimelineTools";
import { AppDispatch } from "./store";
import "./components/TimelineTools.css";
import { fetchMongoData } from "./store/mongoSlice";
import { GroundStation, Satellite } from "./types";
import { transformContactWindowsToTimelineItems } from "./utils/timelineUtils";
import { useTheme } from "./contexts/ThemeContext";

const TimelinePage: React.FC = () => {
  const theme = useTheme();
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
  const [followMode, setFollowMode] = useState(true);


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

  // Update CSS custom properties when theme changes
  useEffect(() => {
    const rootElement = document.documentElement;
    rootElement.style.setProperty('--theme-primary', theme.theme.primary);
    rootElement.style.setProperty('--theme-secondary', theme.theme.secondary);
    rootElement.style.setProperty('--theme-background-gradient', theme.theme.backgroundGradient);
    rootElement.style.setProperty('--theme-background-dark', theme.theme.backgroundDark);
    rootElement.style.setProperty('--theme-background-secondary', theme.theme.buttonBackground);
    rootElement.style.setProperty('--theme-border-gradient', theme.theme.borderGradient);
    rootElement.style.setProperty('--theme-glow-color', theme.theme.glowColor);
    rootElement.style.setProperty('--theme-button-background', theme.theme.buttonBackground);
    rootElement.style.setProperty('--theme-secondary-glow', `rgba(${theme.theme.primaryRGB}, 0.5)`);
  }, [theme]);

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
      zoomMin: 1000 * 60, // 1 minute minimum zoom
      zoomMax: 1000 * 60 * 60 * 24 * 7, // 1 week maximum zoom
      moveable: true,
      zoomable: true,
      selectable: true,
      multiselect: false,
      height: '100%',
      margin: {
        item: {
          horizontal: 10,
          vertical: 8
        }
      },
      orientation: {
        axis: 'bottom' as const,
        item: 'top' as const
      },
      format: {
        minorLabels: {
          millisecond: 'SSS',
          second: 's',
          minute: 'HH:mm',
          hour: 'HH:mm',
          weekday: 'ddd D',
          day: 'D',
          week: 'w',
          month: 'MMM',
          year: 'YYYY'
        },
        majorLabels: {
          millisecond: 'HH:mm:ss',
          second: 'HH:mm:ss',
          minute: 'ddd D MMMM',
          hour: 'ddd D MMMM',
          weekday: 'MMMM YYYY',
          day: 'MMMM YYYY',
          week: 'MMMM YYYY',
          month: 'YYYY',
          year: ''
        }
      },
      tooltip: {
        followMouse: true,
        overflowMethod: 'cap' as const,
        delay: 300
      }
    };

    timelineInstance.current = new Timeline(container, items, options);

    // Enhanced dragging for the current time bar with better visual feedback
    const handleDrag = (event: MouseEvent) => {
      if (!timelineInstance.current) return;

      const timelineBounds = container.getBoundingClientRect();
      const timelineWidth = timelineBounds.width;

      // Calculate the new time based on the mouse position
      const mouseX = event.clientX - timelineBounds.left;
      const percentage = Math.max(0, Math.min(1, mouseX / timelineWidth)); // Clamp between 0 and 1
      const window = timelineInstance.current.getWindow();
      const newTime = new Date(
        window.start.getTime() + percentage * (window.end.getTime() - window.start.getTime())
      );

      timelineInstance.current.setCurrentTime(newTime);
      
      // Disable follow mode when manually dragging
      setFollowMode(false);
    };

    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target && (target.classList.contains("vis-current-time") || 
                    target.closest(".vis-current-time"))) {
        event.preventDefault();
        container.style.cursor = "grabbing";
        
        document.addEventListener("mousemove", handleDrag);
        document.addEventListener("mouseup", () => {
          container.style.cursor = "";
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
      
      // Auto-follow current time if follow mode is enabled
      if (followMode) {
        const window = timelineInstance.current.getWindow();
        const windowDuration = window.end.getTime() - window.start.getTime();
        const buffer = windowDuration * 0.1; // 10% buffer on each side
        
        // Check if current time is outside the visible window (with buffer)
        if (currentTime.getTime() < window.start.getTime() + buffer || 
            currentTime.getTime() > window.end.getTime() - buffer) {
          // Center the window around current time
          const halfWindow = windowDuration / 2;
          timelineInstance.current.setWindow(
            new Date(currentTime.getTime() - halfWindow),
            new Date(currentTime.getTime() + halfWindow),
            { animation: false } // No animation for smooth following
          );
        }
      }
      
      // Log occasionally to show timeline is syncing
      if (Math.random() < 0.02) { // Log ~2% of updates
        console.log(`TimelinePage: Syncing to time: ${cesiumClockTime} (Speed: ${cesiumMultiplier}x, Follow: ${followMode})`);
      }
    } catch (error) {
      console.error("TimelinePage: Error parsing Cesium clock time", error);
    }
  }, [cesiumClockTime, cesiumMultiplier, followMode]); // Include followMode in dependencies

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

    const currentTime = new Date();
    
    // Enable follow mode and center on current time
    setFollowMode(true);
    
    // Center the timeline around current time with a reasonable window
    const windowDuration = 2 * 60 * 60 * 1000; // 2 hours total window
    const halfWindow = windowDuration / 2;
    
    timelineInstance.current.setWindow(
      new Date(currentTime.getTime() - halfWindow),
      new Date(currentTime.getTime() + halfWindow),
      { animation: true }
    );
    
    // Move to current time
    timelineInstance.current.moveTo(currentTime, { animation: true });
  };

  const toggleFollowMode = () => {
    setFollowMode(!followMode);
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
            onToggleFollow={toggleFollowMode}
            followMode={followMode}
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
          background: "linear-gradient(135deg, rgba(0, 20, 0, 0.95), rgba(0, 40, 0, 0.85))",
          border: "2px solid #00ff00",
          borderRadius: "8px",
          boxShadow: "0 0 20px rgba(0, 255, 0, 0.3), inset 0 0 10px rgba(0, 255, 0, 0.1)",
          overflow: "hidden",
          position: "relative"
        }}
      />
    </div>
  );
};

export default TimelinePage;