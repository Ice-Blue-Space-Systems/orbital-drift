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
  selectedSatId: string | null;
  selectedGroundStationId?: string | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  showTle: boolean;
  showGroundTrack: boolean;
  showLineOfSight: boolean;
  showVisibilityCones: boolean;
  showHistory: boolean; // Add showHistory to the state
  showCesiumOptions: boolean; // Add showCesiumOptions to the state
  liveMode: boolean; // Add liveMode to the state
}

const initialState: MongoState = {
  satellites: [],
  groundStations: [],
  contactWindows: [],
  selectedSatId: null,
  status: "idle",
  showTle: false,
  showGroundTrack: false,
  showLineOfSight: false,
  showVisibilityCones: false,
  showHistory: false,
  showCesiumOptions: false,
  liveMode: false, // Add liveMode to the initial state
};

const mongoSlice = createSlice({
  name: "mongo",
  initialState,
  reducers: {
    setSelectedSatId(state, action) {
      state.selectedSatId = action.payload;
    },
    setSelectedGroundStationId(state, action) {
      state.selectedGroundStationId = action.payload;
    },
    setShowTle(state, action) {
      state.showTle = action.payload;
    },
    setShowGroundTrack(state, action) {
      state.showGroundTrack = action.payload;
    },
    setShowLineOfSight(state, action) {
      state.showLineOfSight = action.payload;
    },
    setShowVisibilityCones(state, action) {
      state.showVisibilityCones = action.payload;
    },
    setShowHistory(state, action) {
      state.showHistory = action.payload;
    },
    setShowCesiumOptions(state, action) {
      console.log("Setting showCesiumOptions to:", action.payload);
      state.showCesiumOptions = action.payload; // Reducer for showCesiumOptions
    },
    setLiveMode(state, action) {
      state.liveMode = action.payload; // Reducer for liveMode toggle
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

export const {
  setSelectedSatId,
  setSelectedGroundStationId,
  setShowTle,
  setShowGroundTrack,
  setShowLineOfSight,
  setShowVisibilityCones,
  setShowHistory,
  setShowCesiumOptions, // Export the action
  setLiveMode, // Export the action
} = mongoSlice.actions;
export default mongoSlice.reducer;