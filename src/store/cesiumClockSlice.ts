import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface CesiumClockState {
  iso: string; // ISO string format
  multiplier: number; // Cesium simulation speed multiplier
  isLiveMode: boolean; // User explicitly set to live mode - only changed by user actions
}

const initialState: CesiumClockState = {
  iso: new Date().toISOString(), // Initialize with the current time
  multiplier: 1, // Initialize with real-time speed
  isLiveMode: true, // Start in live mode
};

const cesiumClockSlice = createSlice({
  name: "cesiumClock",
  initialState,
  reducers: {
    setCesiumClockTime(state, action: PayloadAction<string>) {
      state.iso = action.payload; // Store the ISO string
      // Setting time manually is always simulation mode
      state.isLiveMode = false;
    },
    setCesiumClockMultiplier(state, action: PayloadAction<number>) {
      state.multiplier = action.payload; // Store the simulation speed multiplier
      // User explicitly changing speed always puts us in sim mode
      state.isLiveMode = false;
    },
    // Special action for preset buttons - always goes to sim mode
    setSimulationSpeed(state, action: PayloadAction<number>) {
      state.multiplier = action.payload; // Store the simulation speed multiplier
      state.isLiveMode = false; // Preset buttons always go to sim mode
    },
    // System update from Cesium that shouldn't affect live/sim state
    updateCesiumClockMultiplier(state, action: PayloadAction<number>) {
      state.multiplier = action.payload; // Store the simulation speed multiplier
      // Don't change live mode state - this is just a system sync
    },
    resetToLive(state) {
      const now = new Date();
      state.iso = now.toISOString(); // Reset to current time
      state.multiplier = 1; // Reset to 1x speed
      state.isLiveMode = true; // Explicitly set to live mode
    },
  },
});

export const { setCesiumClockTime, setCesiumClockMultiplier, updateCesiumClockMultiplier, setSimulationSpeed, resetToLive } = cesiumClockSlice.actions;

// Selector for live mode - just use the boolean directly
export const selectIsLive = (state: { cesiumClock: CesiumClockState }) => {
  return state.cesiumClock.isLiveMode;
};

export default cesiumClockSlice.reducer;