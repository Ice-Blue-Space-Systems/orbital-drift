import React from "react";
import { Entity } from "resium";
import { CallbackProperty, Color } from "cesium";
import { useSelector } from "react-redux";
import { RootState } from "../store";

interface GroundTrackEntitiesProps {
  groundTrackHistory: CallbackProperty | null;
  groundTrackFuture: CallbackProperty | null;
  satPositionProperty: any;
}

const GroundTrackEntities: React.FC<GroundTrackEntitiesProps> = ({
  groundTrackHistory,
  groundTrackFuture,
  satPositionProperty,
}) => {

  const {showGroundTrack, showHistory} = useSelector((state: RootState) => state.mongo);

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