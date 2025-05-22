import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

import 'cesium/Build/Cesium/Widgets/widgets.css';
import { Ion } from "cesium";

// Replace with your actual Cesium Ion access token
const CESIUM_ION_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI3YTAzMzhmOC02M2UyLTRkZWUtYmRhMC1jYzdkNzE3ZTExMjEiLCJpZCI6MzA1Mjk5LCJpYXQiOjE3NDc5MjA2MTR9.LzEQl5G3rvwCFNmAqc_MVffLf94oaSoiorag9p5PKTc";

Ion.defaultAccessToken = CESIUM_ION_TOKEN;

// Set base URL for Cesium static assets
(window as any).CESIUM_BASE_URL = "/cesium";
 

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);