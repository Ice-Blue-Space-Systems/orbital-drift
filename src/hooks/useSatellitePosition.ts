import { useEffect, useState } from "react";
import { Cartesian3 } from "cesium";

/**
 * Fetches live position of a satellite from wheretheiss.at 
 * Defaults to ISS (25544) if no satelliteId provided.
 */
export function useSatellitePosition(satelliteId = "25544", refreshMs = 5000): Cartesian3 | null {
  const [satellitePosition, setSatellitePosition] = useState<Cartesian3 | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const fetchSatellite = async () => {
      try {
        const res = await fetch(`https://api.wheretheiss.at/v1/satellites/${satelliteId}`);
        const data = await res.json();
        // Altitude is in km, convert to meters
        const position = Cartesian3.fromDegrees(
          data.longitude,
          data.latitude,
          data.altitude * 1000
        );
        setSatellitePosition(position);
      } catch {
        // Optional: handle error
      }
    };

    fetchSatellite();
    interval = setInterval(fetchSatellite, refreshMs);

    return () => clearInterval(interval);
  }, [satelliteId, refreshMs]);

  return satellitePosition;
}