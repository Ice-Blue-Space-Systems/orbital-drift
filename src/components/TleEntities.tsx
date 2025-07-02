import React from "react";
import { Entity } from "resium";
import { CallbackProperty, Color } from "cesium";
import { useSelector } from "react-redux";
import { RootState } from "../store";

interface TleEntitiesProps {
  tleHistory: CallbackProperty | null;
  tleFuture: CallbackProperty | null;
  satPositionProperty: any;
}

const TleEntities: React.FC<TleEntitiesProps> = ({
  tleHistory,
  tleFuture,
  satPositionProperty,
}) => {

  const {showTle, showHistory} = useSelector((state: RootState) => state.mongo);

  if (!showTle || !satPositionProperty) return null;

  return (
    <>
      {/* If "Show TLE" is on, we show the TLE path. If "Show History" is on, render the entire (past + future). Otherwise, show just the current/future. */}
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
      {/* Always show future, or a simplified “Preview” (depending on your preference). */}
      {tleFuture && (
        <Entity
          name="TLE Path - Future"
          polyline={{
            positions: tleFuture,
            width: 2,
            material: Color.GREEN, // Future TLE in green
          }}
        />
      )}
    </>
  );
};

export default TleEntities;