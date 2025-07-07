// filepath: /Users/chrischeshire/Documents/IceBlue/hello-world-react-app/src/store/index.ts
import { configureStore } from "@reduxjs/toolkit";
import mongoReducer from "./mongoSlice";
import tleReducer from "./tleSlice";
import contactWindowsReducer from "./contactWindowsSlice";
import cesiumClockReducer from "./cesiumClockSlice"; // Import the new slice

export const store = configureStore({
  reducer: {
    mongo: mongoReducer,
    tle: tleReducer,
    contactWindows: contactWindowsReducer,
    cesiumClock: cesiumClockReducer, // Add the Cesium clock slice
  },
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;