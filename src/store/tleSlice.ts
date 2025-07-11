//// filepath: /Users/chrischeshire/Documents/IceBlue/hello-world-react-app/src/store/tleSlice.ts
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

export const fetchTleBySatelliteId = createAsyncThunk(
  "tle/fetchTleBySatelliteId",
  async (satelliteId: string) => {
    const response = await fetch(`/api/tle/${satelliteId}`);
    const data = await response.json();
    return data;
  }
);

const tleSlice = createSlice({
  name: "tle",
  initialState: { line1: "", line2: "" },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchTleBySatelliteId.fulfilled, (state, action) => {
      state.line1 = action.payload.line1;
      state.line2 = action.payload.line2;
    });
  },
});

export default tleSlice.reducer;