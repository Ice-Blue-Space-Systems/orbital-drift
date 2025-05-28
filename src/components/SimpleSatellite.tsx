//// filepath: /Users/chrischeshire/Documents/IceBlue/hello-world-react-app/src/SimpleSatellite.tsx
import React, { useEffect, useState } from "react";
import { Entity } from "resium";
import { Cartesian3, Color } from "cesium";
import * as satellite from "satellite.js";

interface SimpleSatelliteProps {
  tleLine1: string;
  tleLine2: string;
  name?: string;
}

export function SimpleSatellite({ tleLine1, tleLine2, name }: SimpleSatelliteProps) {
  const [satPosition, setSatPosition] = useState<Cartesian3 | null>(null);

  useEffect(() => {
    // Use satellite.js to get current position from TLE
    const now = new Date();
    const satrec = satellite.twoline2satrec(tleLine1, tleLine2);
    const positionAndVelocity = satellite.propagate(satrec, now);

    if (positionAndVelocity?.position) {
      const gmst = satellite.gstime(now);
      const geo = satellite.eciToGeodetic(positionAndVelocity.position, gmst);
      const longitude = satellite.degreesLong(geo.longitude);
      const latitude = satellite.degreesLat(geo.latitude);
      const altitude = geo.height * 1000; // kilometers to meters
      setSatPosition(Cartesian3.fromDegrees(longitude, latitude, altitude));
    }
  }, [tleLine1, tleLine2]);

  if (!satPosition) {
    return null; // Don’t plot until we have a valid position
  }

  return (
    <Entity
      position={satPosition}
      name={name || "Unnamed Satellite"}
      point={{ pixelSize: 10, color: Color.YELLOW }}
      description={`TLE-based position of ${name || "Unnamed Satellite"}`}
    />
  );
}