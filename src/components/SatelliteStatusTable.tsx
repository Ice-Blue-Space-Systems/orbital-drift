import React from "react";
import { Cartesian3 } from "cesium";
import { cartesianToLatLonAlt } from "../utils/coordinateUtils";

export interface SatelliteStatusTableProps {
  stationName: string | null;
  stationLat: number | null;
  stationLon: number | null;
  stationAlt: number | null;
  satName: string | null;
  satPosition: Cartesian3;
  trueTlePosition: Cartesian3 | null;
  deviation: number | null;
  expectedInSight: boolean;
  confirmedInSight: boolean;
}

export function SatelliteStatusTable({ ...props }: SatelliteStatusTableProps) {
  // Convert satPosition to lat/lon/alt for display
  let satCoords = { lat: "-", lon: "-", alt: "-" };
  let tleCoords = { lat: "-", lon: "-", alt: "-" };

  if (props.satPosition) {
    const { lat, lon, alt } = cartesianToLatLonAlt(props.satPosition);
    satCoords = {
      lat: lat.toFixed(4),
      lon: lon.toFixed(4),
      alt: alt.toFixed(1),
    };
  }
  if (props.trueTlePosition) {
    const { lat, lon, alt } = cartesianToLatLonAlt(props.trueTlePosition);
    tleCoords = {
      lat: lat.toFixed(4),
      lon: lon.toFixed(4),
      alt: alt.toFixed(1),
    };
  }

  return (
    <div
      style={{
        position: "absolute",
        top: 60,
        right: 20,
        width: 300,
        // Make background transparent and text green
        background: "rgba(0,0,0,0.5)",
        color: "limegreen",
        padding: 10,
        border: "1px solid #ccc",
        zIndex: 999,
      }}
    >
      <h3>Tracking Info</h3>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          <tr>
            <th style={{ textAlign: "left" }}>Station</th>
            <td>{props.stationName || "-"}</td>
          </tr>
          <tr>
            <th style={{ textAlign: "left" }}>Station Lat</th>
            <td>{props.stationLat !== null ? props.stationLat.toFixed(4) : "-"}</td>
          </tr>
          <tr>
            <th style={{ textAlign: "left" }}>Station Lon</th>
            <td>{props.stationLon !== null ? props.stationLon.toFixed(4) : "-"}</td>
          </tr>
          <tr>
            <th style={{ textAlign: "left" }}>Station Alt</th>
            <td>{props.stationAlt !== null ? props.stationAlt.toFixed(1) : "-"}</td>
          </tr>
          <tr>
            <th style={{ textAlign: "left" }}>Satellite</th>
            <td>{props.satName || "-"}</td>
          </tr>
          <tr>
            <th style={{ textAlign: "left" }}>Sat. Lat</th>
            <td>{satCoords.lat}</td>
          </tr>
          <tr>
            <th style={{ textAlign: "left" }}>Sat. Lon</th>
            <td>{satCoords.lon}</td>
          </tr>
          <tr>
            <th style={{ textAlign: "left" }}>Sat. Alt</th>
            <td>{satCoords.alt}</td>
          </tr>
          <tr>
            <th style={{ textAlign: "left" }}>TLE Lat</th>
            <td>{tleCoords.lat}</td>
          </tr>
          <tr>
            <th style={{ textAlign: "left" }}>TLE Lon</th>
            <td>{tleCoords.lon}</td>
          </tr>
          <tr>
            <th style={{ textAlign: "left" }}>TLE Alt</th>
            <td>{tleCoords.alt}</td>
          </tr>
          <tr>
            <th style={{ textAlign: "left" }}>Deviation (m)</th>
            <td>{props.deviation !== null ? props.deviation.toFixed(2) : "-"}</td>
          </tr>
          <tr>
            <th style={{ textAlign: "left" }}>Expected In Sight?</th>
            <td>{props.expectedInSight ? "Yes" : "No"}</td>
          </tr>
          <tr>
            <th style={{ textAlign: "left" }}>Confirmed In Sight?</th>
            <td>{props.confirmedInSight ? "Yes" : "No"}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}