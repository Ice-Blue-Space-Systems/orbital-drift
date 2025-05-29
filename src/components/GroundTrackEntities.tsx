import React from "react";
import { Entity } from "resium";
import { CallbackProperty, Color } from "cesium";

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
  // If showGroundTrack is off or no position property, don’t render anything
  if (!showGroundTrack || !satPositionProperty) return null;

  return (
    <>
      {/* If "Show History" is on, render past positions */}
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

      {/* Always show the future track if showGroundTrack is on */}
      {groundTrackFuture && (
        <Entity
          name="Ground Track - Future"
          polyline={{
            positions: groundTrackFuture,
            width: 2,
            material: Color.YELLOW, // Future ground track in yellow
          }}
        />
      )}
    </>
  );
};

export default GroundTrackEntities;