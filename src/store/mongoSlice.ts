// filepath: /Users/chrischeshire/Documents/IceBlue/hello-world-react-app/src/store/mongoSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

export const fetchMongoData = createAsyncThunk("mongo/fetchData", async () => {
  const satRes = await fetch("http://localhost:5000/api/satellites");
  const gsRes = await fetch("http://localhost:5000/api/ground-stations");
  return {
    satellites: await satRes.json(),
    groundStations: await gsRes.json(),
  };
});

export interface Satellite {
  _id: string;
  name: string;
  type: "live" | "simulated";
  noradId?: number; // Only for live satellites
  description?: string; // Optional description
  currentTleId?: string; // Only for simulated satellites
}

export interface GroundStation {
  _id: string;
  name: string;
  location: {
    lat: number;
    lon: number;
    alt: number;
  };
}

export interface ContactWindow {
  _id: string;
  satelliteId: string;
  groundStationId: string;
  scheduledAOS: string; // ISO date string
  scheduledLOS: string; // ISO date string
}

interface MongoState {
  satellites: Satellite[];
  groundStations: GroundStation[];
  contactWindows: ContactWindow[];
  selectedSatId: string | null; // Add this
  status: "idle" | "loading" | "succeeded" | "failed";
}

const initialState: MongoState = {
  satellites: [],
  groundStations: [],
  contactWindows: [],
  selectedSatId: null, // Initialize it
  status: "idle",
};

const mongoSlice = createSlice({
  name: "mongo",
  initialState,
  reducers: {
    setSelectedSatId(state, action) {
      state.selectedSatId = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMongoData.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchMongoData.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.satellites = action.payload.satellites;
        state.groundStations = action.payload.groundStations;
      })
      .addCase(fetchMongoData.rejected, (state) => {
        state.status = "failed";
      });
  },
});

export const { setSelectedSatId } = mongoSlice.actions;
export default mongoSlice.reducer;