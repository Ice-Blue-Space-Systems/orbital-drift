import { useEffect, useState } from "react";
import { Cartesian3 } from "cesium";

interface N2yoResponse {
  info: {
    satid: number;
  };
  positions: Array<{
    satlatitude: number;
    satlongitude: number;
    sataltitude: number;
  }>;
}

/**
 * Fetch live satellite position from N2YO.
 * @param satelliteId  e.g. "25544" for ISS
 * @param refreshMs    refresh interval in ms
 * @param observerLat  observer’s latitude
 * @param observerLng  observer’s longitude
 * @param observerAlt  observer’s altitude in meters
 * @param apiKey       your N2YO API key
 */
export function useN2yoPosition(
  satelliteId: string,
  refreshMs: number = 60000, // Default to 1 minute
  observerLat: number,
  observerLng: number,
  observerAlt: number,
  apiKey: string
): Cartesian3 | null {
  const [satellitePosition, setSatellitePosition] = useState<Cartesian3 | null>(null);

  useEffect(() => {
    if (!satelliteId || !apiKey) return;

    let interval: NodeJS.Timeout;

    const fetchSatellite = async () => {
      try {
        // Track for 1 second ahead; modify as needed
        const url = `/n2yo/rest/v1/satellite/positions/${satelliteId}/${observerLat}/${observerLng}/${observerAlt / 1000}/1?apiKey=${apiKey}`;
        const res = await fetch(url);
        const data: N2yoResponse = await res.json();

        if (data.positions?.length > 0) {
          const { satlatitude, satlongitude, sataltitude } = data.positions[0];
          // N2YO altitude is in kilometers, multiply if needed
          const altMeters = sataltitude * 1000;
          const position = Cartesian3.fromDegrees(satlongitude, satlatitude, altMeters);
          setSatellitePosition(position);
        }
      } catch {
        // Optional: handle error
      }
    };

    fetchSatellite();
    interval = setInterval(fetchSatellite, refreshMs);

    return () => clearInterval(interval);
  }, [satelliteId, apiKey, refreshMs, observerLat, observerLng, observerAlt]);

  return satellitePosition;
}