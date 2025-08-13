import React, { useEffect, useRef, useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { DataSet } from "vis-data";
import { Timeline } from "vis-timeline/standalone";
import "vis-timeline/styles/vis-timeline-graph2d.min.css";
import "./components/TimelineStyles.css";
import { selectContactWindows, fetchContactWindows } from "./store/contactWindowsSlice";
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

  // State for tracking contact windows loading
  const contactWindowsStatus = useSelector((state: any) => state.contactWindows.status);
  const contactWindowsError = useSelector((state: any) => state.contactWindows.error);

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
      showGroupLabel: false, // Hide group labels
      groupLabelMinWidth: 0, // Set minimum width to 0
      groupsWidth: 0, // Set the groups panel width to 0
      groupsOnRight: false, // Ensure groups are not on the right
      margin: {
        item: {
          horizontal: 10,
          vertical: 8
        },
        axis: 0 // Remove axis margin that might affect the groups panel
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
    
    // Only proceed if we have the necessary data
    if (!satellites.length || !groundStations.length || !filteredContactWindows.length) {
      return;
    }

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

  // Auto-fetch contact windows when selections change
  useEffect(() => {
    if (selectedSatelliteId && selectedGroundStationId) {
      console.log('TimelinePage: Auto-fetching contact windows for:', {
        satelliteId: selectedSatelliteId,
        groundStationId: selectedGroundStationId
      });
      dispatch(fetchContactWindows({ 
        satelliteId: selectedSatelliteId, 
        groundStationId: selectedGroundStationId 
      }));
    }
  }, [selectedSatelliteId, selectedGroundStationId, dispatch]);

  // Timeline control functions
  const jumpToNextContactWindow = () => {
    if (!timelineInstance.current || !nextContactWindow) return;
    
    const startTime = new Date(nextContactWindow.scheduledAOS);
    const endTime = new Date(nextContactWindow.scheduledLOS);
    const duration = endTime.getTime() - startTime.getTime();
    const buffer = duration * 0.2; // 20% buffer
    
    timelineInstance.current.setWindow(
      new Date(startTime.getTime() - buffer),
      new Date(endTime.getTime() + buffer)
    );
  };

  const jumpToStart = () => {
    if (!timelineInstance.current || filteredContactWindows.length === 0) return;
    
    const earliestWindow = filteredContactWindows.reduce((earliest: ContactWindow, current: ContactWindow) => 
      new Date(current.scheduledAOS) < new Date(earliest.scheduledAOS) ? current : earliest
    );
    
    const startTime = new Date(earliestWindow.scheduledAOS);
    const buffer = 2 * 60 * 60 * 1000; // 2 hours buffer
    
    timelineInstance.current.setWindow(
      new Date(startTime.getTime() - buffer),
      new Date(startTime.getTime() + buffer)
    );
  };

  const jumpToNow = () => {
    if (!timelineInstance.current) return;
    
    const now = new Date();
    const buffer = 2 * 60 * 60 * 1000; // 2 hours buffer
    
    timelineInstance.current.setWindow(
      new Date(now.getTime() - buffer),
      new Date(now.getTime() + buffer)
    );
  };

  const zoomIn = () => {
    if (!timelineInstance.current) return;
    const window = timelineInstance.current.getWindow();
    const center = new Date((window.start.getTime() + window.end.getTime()) / 2);
    const duration = window.end.getTime() - window.start.getTime();
    const newDuration = duration * 0.5; // Zoom in by 50%
    
    timelineInstance.current.setWindow(
      new Date(center.getTime() - newDuration / 2),
      new Date(center.getTime() + newDuration / 2)
    );
  };

  const zoomOut = () => {
    if (!timelineInstance.current) return;
    const window = timelineInstance.current.getWindow();
    const center = new Date((window.start.getTime() + window.end.getTime()) / 2);
    const duration = window.end.getTime() - window.start.getTime();
    const newDuration = duration * 2; // Zoom out by 200%
    
    timelineInstance.current.setWindow(
      new Date(center.getTime() - newDuration / 2),
      new Date(center.getTime() + newDuration / 2)
    );
  };

  const fitAllWindows = () => {
    if (!timelineInstance.current || filteredContactWindows.length === 0) return;
    
    const allTimes = filteredContactWindows.flatMap((win: ContactWindow) => [
      new Date(win.scheduledAOS),
      new Date(win.scheduledLOS)
    ]);
    
    const minTime = new Date(Math.min(...allTimes.map((t: Date) => t.getTime())));
    const maxTime = new Date(Math.max(...allTimes.map((t: Date) => t.getTime())));
    const buffer = (maxTime.getTime() - minTime.getTime()) * 0.05; // 5% buffer
    
    timelineInstance.current.setWindow(
      new Date(minTime.getTime() - buffer),
      new Date(maxTime.getTime() + buffer)
    );
  };

  const toggleFollowMode = () => {
    setFollowMode(!followMode);
  };

  const toggleShowAllPairs = () => {
    setShowAllPairs(!showAllPairs);
  };

  return (
    <div
      className="timeline-page"
      style={{
        height: "100vh",
        backgroundColor: "black", // Set the entire page background to black
        display: "flex",
        flexDirection: "column",
        // CSS Custom Properties for the CSS file to use
        '--theme-primary': theme.theme.primary,
        '--theme-primary-rgb': theme.theme.primaryRGB,
        '--theme-background': theme.theme.background,
        '--theme-card-background': theme.theme.cardBackground,
        '--theme-glow-color': theme.theme.glowColor,
        '--theme-text-shadow': theme.theme.textShadow,
        '--theme-background-gradient': theme.theme.backgroundGradient,
        '--theme-background-dark': theme.theme.backgroundDark,
        '--theme-border-gradient': theme.theme.borderGradient,
      } as React.CSSProperties}
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
            color: theme.theme.primary,
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
          <div style={{ marginTop: "8px", fontSize: "12px", color: theme.theme.accent }}>
            <strong>Simulation Speed:</strong> {cesiumMultiplier}x
            {cesiumMultiplier !== 1 && " (Synced with Cesium)"}
          </div>
          {!showAllPairs && (
            <div style={{ marginTop: "4px", fontSize: "11px", color: theme.theme.warning }}>
              <strong>Filter:</strong> Showing selected pairs only
            </div>
          )}
          {/* Contact Windows Status */}
          {selectedSatelliteId && selectedGroundStationId && (
            <div style={{ marginTop: "8px", fontSize: "11px" }}>
              {contactWindowsStatus === "loading" && (
                <div style={{ color: theme.theme.accent, animation: "pulse 1s infinite" }}>
                  🔄 Loading contact windows...
                </div>
              )}
              {contactWindowsStatus === "succeeded" && contactWindows.length > 0 && (
                <div style={{ color: theme.theme.primary }}>
                  ✅ {contactWindows.length} contact windows loaded
                </div>
              )}
              {contactWindowsStatus === "succeeded" && contactWindows.length === 0 && (
                <div style={{ color: theme.theme.warning }}>
                  ⚠️ No contact windows found for this pair
                </div>
              )}
              {contactWindowsStatus === "failed" && (
                <div style={{ color: theme.theme.error }}>
                  ❌ Failed to load contact windows
                  {contactWindowsError && `: ${contactWindowsError}`}
                </div>
              )}
            </div>
          )}
          {/* Instruction message when no selections */}
          {(!selectedSatelliteId || !selectedGroundStationId) && (
            <div style={{ 
              marginTop: "8px", 
              fontSize: "11px", 
              color: theme.theme.textSecondary,
              fontStyle: "italic" 
            }}>
              💡 Select both a satellite and ground station from the left panel to view contact windows
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
          background: theme.theme.background,
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: `1px solid rgba(${theme.theme.primaryRGB}, 0.3)`,
          borderRadius: "12px",
          boxShadow: `
            0 8px 32px rgba(0, 0, 0, 0.4),
            0 0 40px rgba(${theme.theme.primaryRGB}, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.1),
            inset 0 0 20px rgba(${theme.theme.primaryRGB}, 0.05)
          `,
          overflow: "hidden",
        }}
      >
        {/* External left sidebar for satellite/ground station selection */}
        <div
          style={{
            width: "250px",
            borderRight: `1px solid rgba(${theme.theme.primaryRGB}, 0.3)`,
            background: theme.theme.cardBackground,
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            display: "flex",
            flexDirection: "column",
            overflow: "auto",
          }}
        >
          {/* Satellites section */}
          <div style={{ 
            borderBottom: `1px solid ${theme.theme.primary}`, 
            padding: "8px",
            background: theme.theme.backgroundSecondary
          }}>
            <h3 style={{
              margin: 0,
              color: theme.theme.primary,
              fontFamily: "Courier New, Courier, monospace",
              fontSize: "12px",
              textAlign: "center",
              textShadow: `0 0 3px ${theme.theme.primary}`
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
                  borderBottom: `1px solid rgba(${theme.theme.primaryRGB}, 0.2)`,
                  color: selectedSatelliteId === satellite._id ? theme.theme.warning : theme.theme.primary,
                  fontFamily: "Courier New, Courier, monospace",
                  fontSize: "11px",
                  cursor: "pointer",
                  background: selectedSatelliteId === satellite._id 
                    ? `rgba(${theme.theme.warning.replace('#', '').match(/.{2}/g)?.map(hex => parseInt(hex, 16)).join(', ')}, 0.1)` 
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
            borderTop: `1px solid ${theme.theme.primary}`,
            borderBottom: `1px solid ${theme.theme.primary}`, 
            padding: "8px",
            background: theme.theme.backgroundSecondary
          }}>
            <h3 style={{
              margin: 0,
              color: theme.theme.primary,
              fontFamily: "Courier New, Courier, monospace",
              fontSize: "12px",
              textAlign: "center",
              textShadow: `0 0 3px ${theme.theme.primary}`
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
                  borderBottom: `1px solid rgba(${theme.theme.primaryRGB}, 0.2)`,
                  color: selectedGroundStationId === groundStation._id ? theme.theme.warning : theme.theme.primary,
                  fontFamily: "Courier New, Courier, monospace",
                  fontSize: "11px",
                  cursor: "pointer",
                  background: selectedGroundStationId === groundStation._id 
                    ? `rgba(${theme.theme.warning.replace('#', '').match(/.{2}/g)?.map(hex => parseInt(hex, 16)).join(', ')}, 0.1)` 
                    : "transparent",
                  transition: "all 0.2s ease",
                }}
                onClick={() => dispatch({ type: 'mongo/setSelectedGroundStationId', payload: groundStation._id })}
                onMouseEnter={(e) => {
                  if (selectedGroundStationId !== groundStation._id) {
                    e.currentTarget.style.background = `rgba(${theme.theme.primaryRGB}, 0.1)`;
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
            position: "relative",
            background: theme.theme.backgroundGradient,
            borderRadius: "0 6px 6px 0", // Only round the right corners to match the container
          }}
        >
          {/* Overlay for empty state or loading */}
          {(!selectedSatelliteId || !selectedGroundStationId || contactWindowsStatus === "loading") && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(0, 0, 0, 0.7)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                zIndex: 10,
                borderRadius: "0 6px 6px 0",
              }}
            >
              {contactWindowsStatus === "loading" ? (
                // Loading state
                <>
                  <div
                    style={{
                      width: "60px",
                      height: "60px",
                      border: `4px solid rgba(${theme.theme.primaryRGB}, 0.3)`,
                      borderTop: `4px solid ${theme.theme.primary}`,
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                      marginBottom: "20px",
                    }}
                  />
                  <div
                    style={{
                      color: theme.theme.primary,
                      fontSize: "18px",
                      fontFamily: "Courier New, Courier, monospace",
                      fontWeight: "bold",
                      textShadow: `0 0 10px ${theme.theme.primary}`,
                      marginBottom: "8px",
                    }}
                  >
                    Loading Contact Windows...
                  </div>
                  <div
                    style={{
                      color: theme.theme.textSecondary,
                      fontSize: "14px",
                      fontFamily: "Courier New, Courier, monospace",
                    }}
                  >
                    {selectedSatellite?.name} ↔ {selectedGroundStation?.name}
                  </div>
                </>
              ) : (
                // Empty state - no selections
                <>
                  <div
                    style={{
                      fontSize: "48px",
                      marginBottom: "20px",
                      opacity: 0.6,
                    }}
                  >
                    📡
                  </div>
                  <div
                    style={{
                      color: theme.theme.primary,
                      fontSize: "24px",
                      fontFamily: "Courier New, Courier, monospace",
                      fontWeight: "bold",
                      textShadow: `0 0 10px ${theme.theme.primary}`,
                      marginBottom: "16px",
                      textAlign: "center",
                    }}
                  >
                    SELECT SATELLITE & GROUND STATION
                  </div>
                  <div
                    style={{
                      color: theme.theme.textSecondary,
                      fontSize: "16px",
                      fontFamily: "Courier New, Courier, monospace",
                      textAlign: "center",
                      lineHeight: "1.6",
                      maxWidth: "400px",
                    }}
                  >
                    Choose a satellite and ground station from the left panel to view contact windows on the timeline
                  </div>
                  <div
                    style={{
                      marginTop: "24px",
                      padding: "12px 20px",
                      border: `2px solid rgba(${theme.theme.primaryRGB}, 0.3)`,
                      borderRadius: "8px",
                      background: "rgba(0, 0, 0, 0.5)",
                      color: theme.theme.accent,
                      fontSize: "14px",
                      fontFamily: "Courier New, Courier, monospace",
                    }}
                  >
                    💡 TIP: Use the toolbar above to navigate and zoom the timeline
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TimelinePage;