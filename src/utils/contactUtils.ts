import { ContactWindow } from "../types";

/**
 * Filters and sorts contact windows to find the next contact window.
 * @param contactWindows - Array of all contact windows.
 * @param selectedSatId - The ID of the selected satellite.
 * @param selectedGroundStationId - The ID of the selected ground station.
 * @param currentTime - The current time as a Date object.
 * @returns The next contact window or null if none exist.
 */
export function getNextContactWindow(
  contactWindows: ContactWindow[],
  selectedSatId: string | null,
  selectedGroundStationId: string | null,
  currentTime: Date | null
): ContactWindow | null {
  if (!selectedSatId || !selectedGroundStationId || !currentTime) return null;

  const futureWindows = contactWindows.filter(
    (win) =>
      win.satelliteId === selectedSatId &&
      win.groundStationId === selectedGroundStationId &&
      new Date(win.scheduledLOS) > currentTime
  );

  if (!futureWindows.length) return null;

  return futureWindows.sort(
    (a, b) =>
      new Date(a.scheduledAOS).getTime() - new Date(b.scheduledAOS).getTime()
  )[0];
}

/**
 * Formats the next contact window into a readable label.
 * @param nextContactWindow - The next contact window.
 * @returns A formatted label string or "No upcoming contact" if null.
 */
export function formatNextContactWindowLabel(
  nextContactWindow: ContactWindow | null
): string {
  if (!nextContactWindow) return "No upcoming contact";

  return (
    "Next AOS: " +
    new Date(nextContactWindow.scheduledAOS).toISOString() +
    "\nLOS: " +
    new Date(nextContactWindow.scheduledLOS).toISOString()
  );
}