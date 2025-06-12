import React from "react";
import ReactDOM from "react-dom/client";

import "./index.css"; // Import your global styles


import { Provider } from "react-redux";
import { store } from "./store";
import App from "./App";
import { Ion } from "cesium";
import { ThemeProvider } from "@mui/material/styles";
import theme from "./theme"; // Import the custom theme

import 'cesium/Build/Cesium/Widgets/widgets.css';
// Extend the Window interface to include CESIUM_BASE_URL
declare global {
  interface Window {
    CESIUM_BASE_URL: string;
  }
}

window.CESIUM_BASE_URL = "/Cesium"; // Path to the Cesium assets in the public folder

Ion.defaultAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI3YTAzMzhmOC02M2UyLTRkZWUtYmRhMC1jYzdkNzE3ZTExMjEiLCJpZCI6MzA1Mjk5LCJpYXQiOjE3NDc5MjA2MTR9.LzEQl5G3rvwCFNmAqc_MVffLf94oaSoiorag9p5PKTc"; // Optional: Set your Cesium Ion access token

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <App />
      </ThemeProvider>
    </Provider>
  </React.StrictMode>
);