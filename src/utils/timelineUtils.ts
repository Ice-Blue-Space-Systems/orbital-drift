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
      const satellite = satellites.find(sat => sat._id === win.satelliteId);
      const groundStation = groundStations.find(gs => gs._id === win.groundStationId);
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
    const satellite = satellites.find(sat => sat._id === win.satelliteId);
    const groundStation = groundStations.find(gs => gs._id === win.groundStationId);
    
    const duration = new Date(win.scheduledLOS).getTime() - new Date(win.scheduledAOS).getTime();
    const durationMinutes = Math.round(duration / (1000 * 60));
    
    return {
      id: index,
      content: `${durationMinutes}m`,
      start: new Date(win.scheduledAOS),
      end: new Date(win.scheduledLOS),
      group: groupId,
      className: isActive(win) ? "active-window" : "future-window",
      title: `Contact Window\nSatellite: ${satellite?.name || 'Unknown'}\nGround Station: ${groundStation?.name || 'Unknown'}\nAOS: ${new Date(win.scheduledAOS).toLocaleString()}\nLOS: ${new Date(win.scheduledLOS).toLocaleString()}\nDuration: ${durationMinutes} minutes`,
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