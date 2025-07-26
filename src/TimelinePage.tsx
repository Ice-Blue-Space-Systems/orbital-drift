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
import { GroundStation, Satellite, ContactWindow } from "./types";
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
  
  // State for timeline filtering
  const [showAllPairs, setShowAllPairs] = useState(true);
  const [filteredContactWindows, setFilteredContactWindows] = useState(contactWindows);
  
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
    const windowsToCheck = showAllPairs ? contactWindows : filteredContactWindows;
    const futureWindows = windowsToCheck.filter(
      (win: ContactWindow) => new Date(win.scheduledAOS) > now
    );

    if (futureWindows.length === 0) return null;

    // Sort by AOS and return the first one
    return futureWindows.sort(
      (a: ContactWindow, b: ContactWindow) =>
        new Date(a.scheduledAOS).getTime() - new Date(b.scheduledAOS).getTime()
    )[0];
  }, [contactWindows, filteredContactWindows, showAllPairs]);

  // Initialize the timeline
  useEffect(() => {
    if (!timelineRef.current) return;

    const container = timelineRef.current;
    const items = new DataSet([]);
    const groups = new DataSet([]);
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
      groupOrder: 'id',
      stack: false,
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
        followMouse: false,
        overflowMethod: 'cap' as const,
        delay: 100,
        template: (item: any) => {
          // Custom tooltip template to prevent sliding issues
          return item.title || item.content;
        }
      },
      // Prevent item movement on hover
      editable: {
        add: false,
        updateTime: false,
        updateGroup: false,
        remove: false,
        overrideItems: false
      }
    };

    timelineInstance.current = new Timeline(container, items, groups, options);

    // Add event listeners for better interaction
    timelineInstance.current.on('itemover', (properties) => {
      // Prevent any sliding or movement when hovering over items
      if (properties.item !== null) {
        // Ensure the item stays in place
        container.style.cursor = 'pointer';
      }
    });

    timelineInstance.current.on('itemout', (properties) => {
      container.style.cursor = 'default';
    });

    // Prevent item dragging/moving
    timelineInstance.current.on('click', (properties) => {
      if (properties.item !== null) {
        // Optional: Add click behavior for contact windows
        console.log('Contact window clicked:', properties.item);
      }
    });

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

    // Transform filtered contact windows into timeline items and groups using the utility function
    const { items, groups } = transformContactWindowsToTimelineItems(
      filteredContactWindows, 
      satellites, 
      groundStations
    );

    const itemsDataSet = new DataSet(items);
    const groupsDataSet = new DataSet(groups);
    
    timelineInstance.current.setItems(itemsDataSet as any);
    timelineInstance.current.setGroups(groupsDataSet as any);
  }, [filteredContactWindows, satellites, groundStations]);

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

  // Filter contact windows based on selection
  useEffect(() => {
    if (showAllPairs) {
      setFilteredContactWindows(contactWindows);
    } else {
      // Only show contact windows for selected satellite and/or ground station
      const filtered = contactWindows.filter((win: ContactWindow) => {
        const satMatch = !selectedSatelliteId || win.satelliteId === selectedSatelliteId;
        const gsMatch = !selectedGroundStationId || win.groundStationId === selectedGroundStationId;
        return satMatch && gsMatch;
      });
      setFilteredContactWindows(filtered);
    }
  }, [contactWindows, selectedSatelliteId, selectedGroundStationId, showAllPairs]);

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

    const windowsToCheck = showAllPairs ? contactWindows : filteredContactWindows;
    const firstWindow = windowsToCheck[0];
    
    timelineInstance.current.setWindow(
      new Date(firstWindow?.scheduledAOS || Date.now()),
      new Date(firstWindow?.scheduledLOS || Date.now() + 3600 * 1000),
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

  const toggleShowAllPairs = () => {
    setShowAllPairs(!showAllPairs);
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
            onToggleShowAll={toggleShowAllPairs}
            followMode={followMode}
            showAllPairs={showAllPairs}
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
          {!showAllPairs && (
            <div style={{ marginTop: "4px", fontSize: "11px", color: "#ff8800" }}>
              <strong>Filter:</strong> Showing selected pairs only
            </div>
          )}
        </div>
      </div>

      {/* Main timeline container */}
      <div
        style={{
          flex: 1,
          marginTop: "16px",
          height: "80vh",
          display: "flex",
          background: "linear-gradient(135deg, rgba(0, 20, 0, 0.95), rgba(0, 40, 0, 0.85))",
          border: "2px solid #00ff00",
          borderRadius: "8px",
          boxShadow: "0 0 20px rgba(0, 255, 0, 0.3), inset 0 0 10px rgba(0, 255, 0, 0.1)",
          overflow: "hidden",
        }}
      >
        {/* External left sidebar for satellite/ground station selection */}
        <div
          style={{
            width: "250px",
            borderRight: "2px solid #00ff00",
            background: "rgba(0, 30, 0, 0.95)",
            display: "flex",
            flexDirection: "column",
            overflow: "auto",
          }}
        >
          {/* Satellites section */}
          <div style={{ 
            borderBottom: "1px solid #00ff00", 
            padding: "8px",
            background: "rgba(0, 40, 0, 0.8)"
          }}>
            <h3 style={{
              margin: 0,
              color: "#00ff00",
              fontFamily: "Courier New, Courier, monospace",
              fontSize: "12px",
              textAlign: "center",
              textShadow: "0 0 3px #00ff00"
            }}>
              SATELLITES
            </h3>
          </div>
          <div style={{ flex: 1, maxHeight: "45%" }}>
            {satellites.map((satellite: Satellite) => (
              <div
                key={satellite._id}
                style={{
                  padding: "6px 10px",
                  borderBottom: "1px solid rgba(0, 255, 0, 0.2)",
                  color: selectedSatelliteId === satellite._id ? "#ffff00" : "#00ff00",
                  fontFamily: "Courier New, Courier, monospace",
                  fontSize: "11px",
                  cursor: "pointer",
                  background: selectedSatelliteId === satellite._id 
                    ? "rgba(255, 255, 0, 0.1)" 
                    : "transparent",
                  transition: "all 0.2s ease",
                }}
                onClick={() => dispatch({ type: 'mongo/setSelectedSatId', payload: satellite._id })}
                onMouseEnter={(e) => {
                  if (selectedSatelliteId !== satellite._id) {
                    e.currentTarget.style.background = "rgba(0, 255, 0, 0.1)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedSatelliteId !== satellite._id) {
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                <div style={{ fontWeight: "bold", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {satellite.name}
                </div>
                <div style={{ fontSize: "9px", opacity: 0.8 }}>
                  {satellite.type === "live" ? `NORAD: ${satellite.noradId}` : "SIM"}
                </div>
              </div>
            ))}
          </div>

          {/* Ground Stations section */}
          <div style={{ 
            borderTop: "1px solid #00ff00",
            borderBottom: "1px solid #00ff00", 
            padding: "8px",
            background: "rgba(0, 40, 0, 0.8)"
          }}>
            <h3 style={{
              margin: 0,
              color: "#00ff00",
              fontFamily: "Courier New, Courier, monospace",
              fontSize: "12px",
              textAlign: "center",
              textShadow: "0 0 3px #00ff00"
            }}>
              GROUND STATIONS
            </h3>
          </div>
          <div style={{ flex: 1, maxHeight: "45%" }}>
            {groundStations.map((groundStation: GroundStation) => (
              <div
                key={groundStation._id}
                style={{
                  padding: "6px 10px",
                  borderBottom: "1px solid rgba(0, 255, 0, 0.2)",
                  color: selectedGroundStationId === groundStation._id ? "#ffff00" : "#00ff00",
                  fontFamily: "Courier New, Courier, monospace",
                  fontSize: "11px",
                  cursor: "pointer",
                  background: selectedGroundStationId === groundStation._id 
                    ? "rgba(255, 255, 0, 0.1)" 
                    : "transparent",
                  transition: "all 0.2s ease",
                }}
                onClick={() => dispatch({ type: 'mongo/setSelectedGroundStationId', payload: groundStation._id })}
                onMouseEnter={(e) => {
                  if (selectedGroundStationId !== groundStation._id) {
                    e.currentTarget.style.background = "rgba(0, 255, 0, 0.1)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedGroundStationId !== groundStation._id) {
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                <div style={{ fontWeight: "bold", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {groundStation.name}
                </div>
                <div style={{ fontSize: "9px", opacity: 0.8 }}>
                  {groundStation.country && `${groundStation.country}`}
                  {groundStation.bandType && ` • ${groundStation.bandType}`}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline container with built-in group labels */}
        <div
          ref={timelineRef}
          style={{
            flex: 1,
            position: "relative"
          }}
        />
      </div>
    </div>
  );
};

export default TimelinePage;