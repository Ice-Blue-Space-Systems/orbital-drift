import React from "react";
import { Entity } from "resium";
import { Cartesian3, CallbackProperty, Color } from "cesium";

interface GroundTrackEntitiesProps {
  showGroundTrack: boolean;
  showHistory: boolean;
  groundTrackHistory: CallbackProperty | null;
  groundTrackFuture: CallbackProperty | null;
  satPositionProperty: any;
}

const GroundTrackEntities: React.FC<GroundTrackEntitiesProps> = ({
  showGroundTrack,
  showHistory,
  groundTrackHistory,
  groundTrackFuture,
  satPositionProperty,
}) => {
  if (!showGroundTrack || !satPositionProperty) return null;

  return (
    <>
      {showHistory && groundTrackHistory && (
        <Entity
          name="Ground Track - Past"
          polyline={{
            positions: groundTrackHistory,
            width: 2,
            material: Color.GRAY, // Past ground track in gray
          }}
        />
      )}
      {showHistory && groundTrackFuture && (
        <Entity
          name="Ground Track - Future"
          polyline={{
            positions: groundTrackFuture,
            width: 2,
            material: Color.YELLOW, // Future ground track in yellow
          }}
        />
      )}
      {!showHistory && (
        <Entity
          name="Ground Track - Preview"
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
            material: Color.BLUE.withAlpha(0.8), // Preview ground track in blue
          }}
        />
      )}
    </>
  );
};

export default GroundTrackEntities;