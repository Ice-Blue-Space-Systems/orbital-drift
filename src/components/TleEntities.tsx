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
  const { showTle, showHistory } = useSelector((state: RootState) => state.mongo);

  if (!showTle || !satPositionProperty) return null;

  return (
    <>
      {/* Always show future track when TLE is enabled - main green orbital path */}
      {tleFuture && (
        <Entity
          name="TLE Path - Future"
          polyline={{
            positions: tleFuture,
            width: 3, // Thicker for better visibility
            material: Color.GREEN, // Future TLE in bright green
          }}
        />
      )}

      {/* Show history track only when history is enabled - gray trail behind satellite */}
      {showHistory && tleHistory && (
        <Entity
          name="TLE Path - Past"
          polyline={{
            positions: tleHistory,
            width: 2, // Thinner than future
            material: Color.GRAY, // Past TLE in gray
          }}
        />
      )}
    </>
  );
};

export default TleEntities;