import React, { useState } from "react";
import { Viewer, Entity } from "resium";
import { Cartesian3, Color } from "cesium";
import { satellites } from "./satelliteConfig";
import { SatelliteEntity } from "./components/SatelliteEntity";
import { observerLat, observerLng, observerAlt } from "./config";

const groundStationPosition = Cartesian3.fromDegrees(observerLng, observerLat, observerAlt);

function CesiumDashboard() {
  const [selectedSatId, setSelectedSatId] = useState(satellites[0].id);
  const selectedSatellite = satellites.find((sat) => sat.id === selectedSatId);

  return (
    <div style={{ height: "100vh", width: "100vw" }}>
      <select
        value={selectedSatId}
        onChange={(e) => setSelectedSatId(e.target.value)}
        style={{ position: "absolute", zIndex: 999, margin: 10 }}
      >
        {satellites.map((sat) => (
          <option key={sat.id} value={sat.id}>
            {sat.name}
          </option>
        ))}
      </select>

      <Viewer full>
        {selectedSatellite && <SatelliteEntity sat={selectedSatellite} />}
        <Entity
          name="Ground Station"
          position={groundStationPosition}
          point={{ pixelSize: 10, color: Color.BLUE }}
          description="Ground station"
        />
      </Viewer>
    </div>
  );
}

export default CesiumDashboard;