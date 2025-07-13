import React from 'react';
import { Entity } from 'resium';
import { 
  Cartesian3,
  Ellipsoid,
  Color,
  CallbackProperty,
  JulianDate
} from 'cesium';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

interface NadirLinesProps {
  satPositionProperty: any; // Position property for the selected satellite
}

const NadirLines: React.FC<NadirLinesProps> = ({ satPositionProperty }) => {
  const showNadirLines = useSelector((state: RootState) => state.mongo.showNadirLines);
  const selectedSatelliteId = useSelector((state: RootState) => state.mongo.selectedSatId);
  const satellites = useSelector((state: RootState) => state.mongo.satellites);

  if (!showNadirLines || !satPositionProperty || !selectedSatelliteId) {
    return null;
  }

  // Find the selected satellite
  const satellite = satellites.find(sat => sat._id === selectedSatelliteId);
  if (!satellite) return null;

  // Create a callback property for the nadir line positions
  const nadirLinePositions = new CallbackProperty((time: JulianDate | undefined) => {
    if (!time) return [];
    try {
      // Get satellite position at current time
      const satPosition = satPositionProperty.getValue(time);
      if (!satPosition) return [];

      // Calculate the subsatellite point (nadir point)
      const cartographic = Ellipsoid.WGS84.cartesianToCartographic(satPosition);
      const nadirPoint = Cartesian3.fromRadians(
        cartographic.longitude,
        cartographic.latitude,
        0 // Ground level
      );

      return [satPosition, nadirPoint];
    } catch (error) {
      console.warn('Error calculating nadir line:', error);
      return [];
    }
  }, false);

  return (
    <Entity
      id={`nadir-line-${selectedSatelliteId}`}
      name={`Nadir Line - ${satellite.name}`}
      polyline={{
        positions: nadirLinePositions,
        width: 3,
        material: Color.LIME.withAlpha(0.8),
        clampToGround: false,
      }}
    />
  );
};

export default NadirLines;
