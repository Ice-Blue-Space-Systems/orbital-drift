// filepath: /Users/chrischeshire/Documents/IceBlue/hello-world-react-app/src/store/index.ts
import { configureStore } from "@reduxjs/toolkit";
import mongoReducer from "./mongoSlice";
import tleReducer from "./tleSlice";
import contactWindowsReducer from "./contactWindowsSlice";

export const store = configureStore({
  reducer: {
    mongo: mongoReducer,
    tle: tleReducer,
    contactWindows: contactWindowsReducer, // Add the new slice here
  },
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;