import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { ContactWindow } from "../types";

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

// Async thunk to refresh contact windows (generate new ones)
export const refreshContactWindows = createAsyncThunk(
  "contactWindows/refreshContactWindows",
  async ({ satelliteId, groundStationId }: { satelliteId: string; groundStationId: string }) => {
    // First, trigger the refresh on the backend
    await axios.post("/api/contact-windows/refresh");
    
    // Then fetch the updated contact windows
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
        state.error = action.error.message || "Failed to fetch contact windows";
      })
      .addCase(refreshContactWindows.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(refreshContactWindows.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload;
      })
      .addCase(refreshContactWindows.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Failed to refresh contact windows";
      });
  },
});

export const selectContactWindows = (state: { contactWindows: ContactWindowsState }) => state.contactWindows.data;
export const selectContactWindowsStatus = (state: { contactWindows: ContactWindowsState }) => state.contactWindows.status;
export const selectContactWindowsError = (state: { contactWindows: ContactWindowsState }) => state.contactWindows.error;

export default contactWindowsSlice.reducer;