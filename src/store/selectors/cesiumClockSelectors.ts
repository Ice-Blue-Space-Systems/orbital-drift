import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "../index";

export const selectCesiumClockIso = (state: RootState) => state.cesiumClock.iso;

export const selectCesiumClockDate = createSelector(
  selectCesiumClockIso,
  (iso) => new Date(iso)
);

export const selectCesiumClockUtc = createSelector(
  selectCesiumClockDate,
  (date) => date.toUTCString()
);

export const selectCesiumClockLocal = createSelector(
  selectCesiumClockDate,
  (date) => date.toLocaleString()
);