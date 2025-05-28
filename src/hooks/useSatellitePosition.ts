// filepath: /Users/chrischeshire/Documents/IceBlue/hello-world-react-app/src/hooks/useSatellitePosition.ts
import { useEffect, useState } from "react";
import { Cartesian3 } from "cesium";

export function useSatellitePosition(satelliteId: string): Cartesian3 | null {
  const [satellitePosition, setSatellitePosition] = useState<Cartesian3 | null>(null);

  useEffect(() => {
    const fetchSatellite = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/satellites/${satelliteId}`);
        const data = await res.json();
        const position = Cartesian3.fromDegrees(data.longitude, data.latitude, data.altitude * 1000);
        setSatellitePosition(position);
      } catch (err) {
        console.error("Failed to fetch satellite position:", err);
      }
    };

    fetchSatellite();
  }, [satelliteId]);

  return satellitePosition;
}