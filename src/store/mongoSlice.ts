// filepath: /Users/chrischeshire/Documents/IceBlue/hello-world-react-app/src/store/mongoSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { ContactWindow, GroundStation, Satellite } from "../types";

export const fetchMongoData = createAsyncThunk("mongo/fetchData", async () => {
  const satRes = await fetch("/api/satellites");
  const gsRes = await fetch("/api/ground-stations");
  return {
    satellites: await satRes.json(),
    groundStations: await gsRes.json(),
  };
});

interface MongoState {
  satellites: Satellite[];
  groundStations: GroundStation[];
  contactWindows: ContactWindow[];
  selectedSatId: string | null;
  selectedGroundStationId: string | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  showTle: boolean;
  showGroundTrack: boolean;
  showLineOfSight: boolean;
  showVisibilityCones: boolean;
  showNadirLines: boolean; // Add showNadirLines to the state  
  showHistory: boolean; // Add showHistory to the state
  showCesiumOptions: boolean; // Add showCesiumOptions to the state
  liveMode: boolean; // Add liveMode to the state
  tleHistoryDuration: number; // TLE history duration in seconds
  tleFutureDuration: number; // TLE future duration in seconds
}

const initialState: MongoState = {
  satellites: [],
  groundStations: [],
  contactWindows: [],
  selectedSatId: null,
  selectedGroundStationId: null,
  status: "idle",
  showTle: false,
  showGroundTrack: false,
  showLineOfSight: false,
  showVisibilityCones: false,
  showNadirLines: false, // Add showNadirLines to the initial state
  showHistory: false,
  showCesiumOptions: false,
  liveMode: false, // Add liveMode to the initial state
  tleHistoryDuration: 3600, // Default: 1 hour (3600 seconds)
  tleFutureDuration: 10800, // Default: 3 hours (10800 seconds)
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
    setShowNadirLines(state, action) {
      state.showNadirLines = action.payload;
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
    addSatellite(state, action) {
      state.satellites.push(action.payload); // Add a new satellite to the state
    },
    setTleHistoryDuration(state, action) {
      state.tleHistoryDuration = action.payload;
    },
    setTleFutureDuration(state, action) {
      state.tleFutureDuration = action.payload;
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
  setShowNadirLines, // Export the action
  setShowHistory,
  setShowCesiumOptions, // Export the action
  setLiveMode, // Export the action
  addSatellite, // Export the action
  setTleHistoryDuration,
  setTleFutureDuration,
} = mongoSlice.actions;
export default mongoSlice.reducer;