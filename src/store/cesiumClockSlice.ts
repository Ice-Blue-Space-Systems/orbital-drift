import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface CesiumClockState {
  iso: string; // ISO string format
}

const initialState: CesiumClockState = {
  iso: new Date().toISOString(), // Initialize with the current time
};

const cesiumClockSlice = createSlice({
  name: "cesiumClock",
  initialState,
  reducers: {
    setCesiumClockTime(state, action: PayloadAction<string>) {
      state.iso = action.payload; // Store the ISO string
    },
  },
});

export const { setCesiumClockTime } = cesiumClockSlice.actions;

export default cesiumClockSlice.reducer;