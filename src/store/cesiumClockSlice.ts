import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface CesiumClockState {
  iso: string; // ISO string format
  multiplier: number; // Cesium simulation speed multiplier
}

const initialState: CesiumClockState = {
  iso: new Date().toISOString(), // Initialize with the current time
  multiplier: 1, // Initialize with real-time speed
};

const cesiumClockSlice = createSlice({
  name: "cesiumClock",
  initialState,
  reducers: {
    setCesiumClockTime(state, action: PayloadAction<string>) {
      state.iso = action.payload; // Store the ISO string
    },
    setCesiumClockMultiplier(state, action: PayloadAction<number>) {
      state.multiplier = action.payload; // Store the simulation speed multiplier
    },
  },
});

export const { setCesiumClockTime, setCesiumClockMultiplier } = cesiumClockSlice.actions;

export default cesiumClockSlice.reducer;