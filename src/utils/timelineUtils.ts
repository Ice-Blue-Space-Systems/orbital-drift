import { ContactWindow, Satellite, GroundStation } from "../types";

/**
 * Transforms contact windows into timeline items for the vis-timeline with groups.
 * @param windows - Array of contact windows.
 * @param satellites - Array of satellites.
 * @param groundStations - Array of ground stations.
 * @returns Object containing timeline items and groups.
 */
export function transformContactWindowsToTimelineItems(
  windows: ContactWindow[],
  satellites: Satellite[] = [],
  groundStations: GroundStation[] = []
): {
  items: {
    id: number;
    content: string;
    start: Date;
    end: Date;
    group: string;
    className: string;
    title: string;
  }[];
  groups: {
    id: string;
    content: string;
    className: string;
  }[];
} {
  // Create groups for each satellite-ground station pair that has contact windows
  const groupMap = new Map<string, { satellite: Satellite; groundStation: GroundStation }>();
  
  windows.forEach(win => {
    const groupId = `${win.satelliteId}-${win.groundStationId}`;
    if (!groupMap.has(groupId)) {
      // Try exact match first
      let satellite = satellites.find(sat => sat._id === win.satelliteId);
      let groundStation = groundStations.find(gs => gs._id === win.groundStationId);
      
      // If exact match fails, try string comparison (in case of ObjectId vs string issues)
      if (!satellite) {
        satellite = satellites.find(sat => String(sat._id) === String(win.satelliteId));
      }
      if (!groundStation) {
        groundStation = groundStations.find(gs => String(gs._id) === String(win.groundStationId));
      }
      
      if (satellite && groundStation) {
        groupMap.set(groupId, { satellite, groundStation });
      }
    }
  });

  const groups = Array.from(groupMap.entries()).map(([groupId, { satellite, groundStation }]) => ({
    id: groupId,
    content: `${satellite.name} ↔ ${groundStation.name}`,
    className: 'timeline-group',
  }));

  const items = windows.map((win, index) => {
    const groupId = `${win.satelliteId}-${win.groundStationId}`;
    
    // Try exact match first, then string comparison as fallback
    let satellite = satellites.find(sat => sat._id === win.satelliteId);
    let groundStation = groundStations.find(gs => gs._id === win.groundStationId);
    
    if (!satellite) {
      satellite = satellites.find(sat => String(sat._id) === String(win.satelliteId));
    }
    if (!groundStation) {
      groundStation = groundStations.find(gs => String(gs._id) === String(win.groundStationId));
    }
    
    const startTime = new Date(win.scheduledAOS);
    const endTime = new Date(win.scheduledLOS);
    const duration = endTime.getTime() - startTime.getTime();
    const durationMinutes = Math.round(duration / (1000 * 60));
    
    // Create detailed tooltip content
    const tooltipContent = [
      `🛰️  ${satellite?.name || 'Unknown Satellite'}`,
      `📡  ${groundStation?.name || 'Unknown Ground Station'}`,
      ``,
      `📅  ${startTime.toLocaleDateString()}`,
      `🕐  AOS: ${startTime.toLocaleTimeString()}`,
      `🕐  LOS: ${endTime.toLocaleTimeString()}`,
      `⏱️   Duration: ${durationMinutes} minutes`,
      ``,
      `${groundStation?.country ? `🌍  ${groundStation.country}` : ''}`,
      `${groundStation?.bandType ? `📶  ${groundStation.bandType}-Band` : ''}`,
      `${satellite?.type === 'live' ? `🔴  Live (NORAD: ${satellite.noradId})` : '🟡  Simulated'}`
    ].filter(line => line !== '').join('\n');
    
    return {
      id: index,
      content: `${durationMinutes}m`,
      start: startTime,
      end: endTime,
      group: groupId,
      className: isActive(win) ? "active-window" : "future-window",
      title: tooltipContent,
    };
  });

  return { items, groups };
}

/**
 * Determines if a contact window is currently active.
 * @param window - The contact window.
 * @returns True if the window is active, false otherwise.
 */
function isActive(window: ContactWindow): boolean {
  const now = new Date();
  return (
    new Date(window.scheduledAOS) <= now && new Date(window.scheduledLOS) >= now
  );
}