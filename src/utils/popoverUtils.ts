import { ContactWindow } from "../types";

/**
 * Shared utility for generating consistent ContactWindowsPopover props
 * Used by both GlobeTools and TimelineTools to avoid duplication
 */
export const getContactWindowsPopoverProps = (
  selectedSatelliteId: string | null,
  selectedGroundStationId: string | null,
  selectedSatellite: any,
  selectedGroundStation: any,
  nextContactWindow: ContactWindow | null,
  currentTime?: Date
) => ({
  nextContactWindow,
  selectedSatelliteName: selectedSatellite?.name || selectedSatelliteId,
  selectedGroundStationName: selectedGroundStation?.name || selectedGroundStationId,
  currentTime,
  satelliteId: selectedSatelliteId || undefined,
  groundStationId: selectedGroundStationId || undefined,
  showPlaceholder: !selectedSatelliteId || !selectedGroundStationId,
});
