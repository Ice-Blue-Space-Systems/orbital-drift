import React, { useEffect, useState } from "react";
import { Entity, PolylineGraphics, LabelGraphics } from "resium";
import { Cartesian3, Color } from "cesium";
import { SatelliteConfig } from "../satelliteConfig";
import { getFuturePositions } from "../utils/tleUtils";
import { useN2yoPosition } from "../hooks/useN2yoPosition";
import { observerLat, observerLng, observerAlt, n2yoApiKey } from "../config";

const groundStationPosition = Cartesian3.fromDegrees(-75.0, 40.0, 0);

interface SatelliteEntityProps {
  sat: SatelliteConfig;
}

export function SatelliteEntity({ sat }: SatelliteEntityProps) {
  // Live position from N2YO
  const livePosition = useN2yoPosition(
    sat.id,
    60000, // Refresh every 1 minute
    observerLat,
    observerLng,
    observerAlt,
    n2yoApiKey
  );

  // Future path based on TLE
  const [futurePath, setFuturePath] = useState<Cartesian3[]>([]);

  // Predicted position at the current time (from TLE)
  const [tlePredictedPosition, setTlePredictedPosition] = useState<Cartesian3 | null>(null);

  // Deviation between live and TLE-predicted positions
  const [deviation, setDeviation] = useState<number | null>(null);

  useEffect(() => {
    if (sat.tleLine1 && sat.tleLine2) {
      const path = getFuturePositions(sat.tleLine1, sat.tleLine2, 90);
      setFuturePath(path);

      const now = new Date();
      const tlePosition = getFuturePositions(sat.tleLine1, sat.tleLine2, 1)[0];
      setTlePredictedPosition(tlePosition);
    } else {
      setFuturePath([]);
      setTlePredictedPosition(null);
    }
  }, [sat.tleLine1, sat.tleLine2]);

  useEffect(() => {
    if (livePosition && tlePredictedPosition) {
      const deviationMeters = Cartesian3.distance(livePosition, tlePredictedPosition);
      setDeviation(deviationMeters);
    } else {
      setDeviation(null);
    }
  }, [livePosition, tlePredictedPosition]);

  return (
    <>
      {livePosition && (
        <>
          <Entity
            name={sat.name}
            position={livePosition!}
            point={{ pixelSize: 12, color: sat.color }}
            description={`Live tracking of ${sat.name}`}
          />
          <Entity>
            <PolylineGraphics
              positions={[groundStationPosition, livePosition]}
              width={2}
              material={sat.color}
            />
          </Entity>
        </>
      )}

      {futurePath.length > 0 && (
        <Entity name={`${sat.name} Future Path`}>
          <PolylineGraphics
            positions={futurePath}
            width={2}
            material={Color.CYAN}
          />
        </Entity>
      )}

      {tlePredictedPosition && (
        <Entity
          name={`${sat.name} TLE Predicted`}
          position={tlePredictedPosition}
          point={{ pixelSize: 8, color: Color.GREEN }}
          description={`TLE-predicted position of ${sat.name}`}
        />
      )}

      {deviation !== null && (
        <Entity
          position={livePosition!}
          label={{
            text: `Deviation: ${deviation.toFixed(2)} m`,
            font: "14pt sans-serif",
            fillColor: Color.RED,
            showBackground: true,
          }}
        />
      )}
    </>
  );
}