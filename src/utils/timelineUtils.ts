import { ContactWindow } from "../types";

/**
 * Transforms contact windows into timeline items for the vis-timeline.
 * @param windows - Array of contact windows.
 * @returns Array of timeline items.
 */
export function transformContactWindowsToTimelineItems(
  windows: ContactWindow[]
): {
  id: number;
  content: string;
  start: Date;
  end: Date;
  className: string;
}[] {
  return windows.map((win, index) => ({
    id: index,
    content: `Contact ${index + 1}`,
    start: new Date(win.scheduledAOS),
    end: new Date(win.scheduledLOS),
    className: isActive(win) ? "active-window" : "future-window",
  }));
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