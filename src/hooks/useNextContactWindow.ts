import { useMemo } from "react";

type ContactWindow = {
  satelliteId: string;
  groundStationId: string;
  scheduledAOS: string | number | Date;
  scheduledLOS: string | number | Date;
};

type UseNextContactWindowProps = {
  contactWindows: ContactWindow[];
  selectedSatId: string | null;
  selectedGroundStationId: any;
  currentTime: Date | null;
};

export function useNextContactWindow({
  contactWindows,
  selectedSatId,
  selectedGroundStationId,
  currentTime,
}: UseNextContactWindowProps): {
  nextContactWindow: ContactWindow | null;
  nextAosLosLabel: string;
} {
  const nextContactWindow = useMemo(() => {
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
  }, [contactWindows, selectedSatId, selectedGroundStationId, currentTime]);

  const nextAosLosLabel = useMemo(() => {
    if (!nextContactWindow) return "No upcoming contact";
    return (
      "Next AOS: " +
      new Date(nextContactWindow.scheduledAOS).toISOString() +
      "\nLOS: " +
      new Date(nextContactWindow.scheduledLOS).toISOString()
    );
  }, [nextContactWindow]);

  return { nextContactWindow, nextAosLosLabel };
}