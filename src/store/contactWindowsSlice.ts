import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

interface ContactWindow {
  _id: string;
  satelliteId: string;
  groundStationId: string;
  scheduledAOS: string;
  scheduledLOS: string;
  maxElevationDeg: number;
  durationSeconds: number;
  status: string;
}

interface ContactWindowsState {
  data: ContactWindow[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: ContactWindowsState = {
  data: [],
  status: "idle",
  error: null,
};

// Async thunk to fetch contact windows
export const fetchContactWindows = createAsyncThunk(
  "contactWindows/fetchContactWindows",
  async ({ satelliteId, groundStationId }: { satelliteId: string; groundStationId: string }) => {
    const params = new URLSearchParams();
    if (satelliteId) params.append("satelliteId", satelliteId);
    if (groundStationId) params.append("groundStationId", groundStationId);

    const response = await axios.get(`/api/contact-windows?${params.toString()}`);
    return response.data;
  }
);

const contactWindowsSlice = createSlice({
  name: "contactWindows",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchContactWindows.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchContactWindows.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload;
      })
      .addCase(fetchContactWindows.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Failed to fetch contact windows.";
      });
  },
});

export const selectContactWindows = (state: any) => state.contactWindows.data;
export const selectContactWindowsStatus = (state: any) => state.contactWindows.status;
export const selectContactWindowsError = (state: any) => state.contactWindows.error;

export default contactWindowsSlice.reducer;