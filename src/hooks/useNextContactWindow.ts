import { useMemo } from "react";
import { ContactWindow } from "../types";
import {
  getNextContactWindow,
  formatNextContactWindowLabel,
} from "../utils/contactUtils";

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
  const nextContactWindow = useMemo(
    () =>
      getNextContactWindow(
        contactWindows,
        selectedSatId,
        selectedGroundStationId,
        currentTime
      ),
    [contactWindows, selectedSatId, selectedGroundStationId, currentTime]
  );

  const nextAosLosLabel = useMemo(
    () => formatNextContactWindowLabel(nextContactWindow),
    [nextContactWindow]
  );

  return { nextContactWindow, nextAosLosLabel };
}