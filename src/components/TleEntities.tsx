import React from "react";
import { Entity } from "resium";
import { Cartesian3, CallbackProperty, Color } from "cesium";

interface TleEntitiesProps {
  showTle: boolean;
  showHistory: boolean;
  tleHistory: CallbackProperty | null;
  tleFuture: CallbackProperty | null;
  satPositionProperty: any;
}

const TleEntities: React.FC<TleEntitiesProps> = ({
  showTle,
  showHistory,
  tleHistory,
  tleFuture,
  satPositionProperty,
}) => {
  if (!showTle || !satPositionProperty) return null;

  return (
    <>
      {showHistory && tleHistory && (
        <Entity
          name="TLE Path - Past"
          polyline={{
            positions: tleHistory,
            width: 2,
            material: Color.GRAY, // Past TLE in gray
          }}
        />
      )}
      {showHistory && tleFuture && (
        <Entity
          name="TLE Path - Future"
          polyline={{
            positions: tleFuture,
            width: 2,
            material: Color.GREEN, // Future TLE in green
          }}
        />
      )}
      {!showHistory && (
        <Entity
          name="TLE Path - Preview"
          polyline={{
            positions: new CallbackProperty(() => {
              const positions: Cartesian3[] = [];
              const now = new Date();
              const durationSeconds = 3600; // 1 hour
              const stepSeconds = 60; // 1-minute intervals
              for (let i = 0; i <= durationSeconds; i += stepSeconds) {
                const time = new Date(now.getTime() + i * 1000);
                const pos = satPositionProperty.getValue(time);
                if (pos) positions.push(pos);
              }
              return positions;
            }, false),
            width: 2,
            material: Color.BLUE.withAlpha(0.8), // Preview TLE in blue
          }}
        />
      )}
    </>
  );
};

export default TleEntities;